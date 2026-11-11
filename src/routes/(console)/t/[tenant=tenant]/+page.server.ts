import { fail, isRedirect, redirect } from '@sveltejs/kit';
import { isConfirmed } from '#lib/server/confirm';
import { getQuota } from '#lib/server/quota';
import { deleteTenant, patchTenant } from '#lib/server/tenants';
import type { Actions, PageServerLoad } from './$types';

// What the tenant uses of its quota. The overview is useful without it, so a failure of the API here is not an error page: the
// usage is left out. A person who has to sign in again still goes to sign in.
export const load: PageServerLoad = async (event) => {
    try {
        return { quota: await getQuota(event, event.params.tenant) };
    } catch (error) {
        if (isRedirect(error)) throw error;
        return { quota: undefined };
    }
};

export const actions: Actions = {
    // Change the display name. The name and the owner cannot change.
    update: async (event) => {
        const form = await event.request.formData();
        const displayName = String(form.get('displayName') ?? '').trim();
        if (displayName.length > 100)
            return fail(400, {
                update: { saved: false, message: 'The display name is 100 characters at most.' }
            });

        const result = await patchTenant(event, event.params.tenant, { displayName });
        if (result.ok === false)
            return fail(result.status, { update: { saved: false, message: result.message } });
        return { update: { saved: true, message: undefined } };
    },

    // Delete the tenant and everything in it. Nothing happens unless the exact name was typed.
    delete: async (event) => {
        const name = event.params.tenant;
        if (!isConfirmed(await event.request.formData(), name))
            return fail(400, { remove: { message: `The name you typed is not ${name}.` } });
        const result = await deleteTenant(event, name);
        if (result.ok === false)
            return fail(result.status, { remove: { message: result.message } });
        // The tenant stays, `Deleting`, until everything it is made of is gone: its page follows it.
        redirect(303, `/t/${name}`);
    }
};
