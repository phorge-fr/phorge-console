import { fail, redirect } from '@sveltejs/kit';
import { PROFILE_NAME } from '#lib/profiles';
import { isConfirmed } from '#lib/server/confirm';
import { deleteProfile, listProfiles } from '#lib/server/profiles';
import type { Actions, PageServerLoad } from './$types';

// Anybody with a role on the tenant reads the profiles; creating and deleting are for operators and administrators, which the API decides.
export const load: PageServerLoad = async (event) => {
    const profiles = await listProfiles(event, event.params.tenant);
    // `?delete=<profile>` asks for the confirmation of a deletion: the page shows it without needing JavaScript.
    const asked = event.url.searchParams.get('delete');
    return {
        profiles,
        confirm: profiles.find(
            (profile) => profile.name === asked && !profile.builtin && profile.phase !== 'Deleting'
        )?.name
    };
};

export const actions: Actions = {
    // Delete a profile a user made. Nothing happens unless the exact name was typed. The name comes in the address of the action (`?/delete&profile=`).
    delete: async (event) => {
        const profile = event.url.searchParams.get('profile') ?? '';
        if (!PROFILE_NAME.test(profile))
            return fail(400, { remove: { profile, message: 'No such profile.' } });
        if (!isConfirmed(await event.request.formData(), profile))
            return fail(400, {
                remove: { profile, message: `The name you typed is not ${profile}.` }
            });
        const result = await deleteProfile(event, event.params.tenant, profile);
        if (result.ok === false)
            return fail(result.status, { remove: { profile, message: result.message } });
        redirect(303, `/t/${event.params.tenant}/profiles`);
    }
};
