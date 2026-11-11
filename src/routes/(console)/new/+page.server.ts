import { error, fail, redirect } from '@sveltejs/kit';
import { createTenant } from '#lib/server/tenants';
import { TENANT_NAME } from '../../../params/tenant';
import type { Actions, PageServerLoad } from './$types';

// Creating a tenant is for the people the API allows (`canCreateTenants` of `GET /v1/whoami`, true for any signed-in person with an
// email). The API decides; this only keeps the form from being offered to a key.
export const load: PageServerLoad = async ({ parent }) => {
    const { canCreateTenants } = await parent();
    if (!canCreateTenants) error(403, 'You cannot create a tenant.');
    return {};
};

export const actions: Actions = {
    // The person is the owner: it is not a choice, and a tenant has the same limits as every other.
    default: async (event) => {
        const form = await event.request.formData();
        const name = String(form.get('name') ?? '').trim();
        const displayName = String(form.get('displayName') ?? '').trim();
        const values = { name, displayName };

        // What the person can fix is said here, in their words; the API checks it all again.
        if (!TENANT_NAME.test(name))
            return fail(400, {
                values,
                message:
                    'The name has 2 to 28 characters: lowercase letters, digits and hyphens, starting with a letter.'
            });
        if (displayName.length > 100)
            return fail(400, { values, message: 'The display name is 100 characters at most.' });

        const result = await createTenant(event, { name, ...(displayName ? { displayName } : {}) });
        if (result.ok === false) return fail(result.status, { values, message: result.message });
        // The tenant exists and is being made: its page follows it until it is ready.
        redirect(303, `/t/${name}`);
    }
};
