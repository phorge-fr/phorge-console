import { fail, redirect } from '@sveltejs/kit';
import { PLANS, type Plan } from '#lib/plans';
import { isConfirmed } from '#lib/server/confirm';
import { deleteTenant, patchTenant } from '#lib/server/tenants';
import type { Actions } from './$types';

export const actions: Actions = {
    // Change the plan and the display name. The name and the owner cannot change.
    update: async (event) => {
        const form = await event.request.formData();
        const displayName = String(form.get('displayName') ?? '').trim();
        const plan = String(form.get('plan') ?? '');
        if (displayName.length > 100)
            return fail(400, {
                update: { saved: false, message: 'The display name is 100 characters at most.' }
            });
        if (!(plan in PLANS))
            return fail(400, { update: { saved: false, message: 'Choose a plan.' } });

        const result = await patchTenant(event, event.params.tenant, {
            displayName,
            plan: plan as Plan
        });
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
