import { fail, isRedirect, redirect } from '@sveltejs/kit';
import { BUILTIN_PROFILE_NAMES } from '#lib/profiles';
import { isConfirmed } from '#lib/server/confirm';
import { listInstances } from '#lib/server/instances';
import { deleteProfile, getProfile } from '#lib/server/profiles';
import { labelKey } from '#lib/server/sshkeys';
import type { Actions, PageServerLoad } from './$types';

// Anybody with a role on the tenant reads the profile; deleting it is for operators and administrators, which the API decides.
export const load: PageServerLoad = async (event) => {
    const [profile, instances] = await Promise.all([
        getProfile(event, event.params.tenant, event.params.name),
        // The virtual machines that have it. Without the list the page still shows the profile and says so.
        listInstances(event, event.params.tenant).catch((error) => {
            if (isRedirect(error)) throw error;
            return undefined;
        })
    ]);
    return {
        profile,
        // The keys the profile gives, as a person recognises them: the type, the fingerprint and the comment.
        keys: (profile.sshPublicKeys ?? []).map(labelKey),
        instances: instances?.filter((instance) => instance.profile === profile.name)
    };
};

export const actions: Actions = {
    // Delete a profile a user made. Nothing happens unless the exact name was typed. The API refuses (409, `in_use`) while an
    // instance has the profile and names the instances: its sentence is shown as it is.
    delete: async (event) => {
        const name = event.params.name;
        if (BUILTIN_PROFILE_NAMES.includes(name))
            return fail(403, {
                remove: {
                    message: `${name} is one of the three profiles every tenant has: it cannot be deleted.`
                }
            });
        if (!isConfirmed(await event.request.formData(), name))
            return fail(400, { remove: { message: `The name you typed is not ${name}.` } });
        const result = await deleteProfile(event, event.params.tenant, name);
        if (result.ok === false)
            return fail(result.status, { remove: { message: result.message } });
        // The profile stays, `Deleting`, until it is gone: the list follows it and says what became of it.
        redirect(303, `/t/${event.params.tenant}/profiles?deleted=${name}`);
    }
};
