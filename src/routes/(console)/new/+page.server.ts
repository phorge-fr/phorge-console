import { error, fail, redirect } from '@sveltejs/kit';
import { PLANS, type Plan } from '#lib/plans';
import { createTenant } from '#lib/server/tenants';
import { TENANT_NAME } from '../../../params/tenant';
import type { Actions, PageServerLoad } from './$types';

// Creating a tenant is for platform administrators. The API decides; this only keeps the form from being offered to everybody.
export const load: PageServerLoad = async ({ parent }) => {
    const { platformAdmin, user } = await parent();
    if (!platformAdmin) error(403, 'Only platform administrators can create a tenant.');
    return { owner: user.email };
};

export const actions: Actions = {
    default: async (event) => {
        const form = await event.request.formData();
        const name = String(form.get('name') ?? '').trim();
        const displayName = String(form.get('displayName') ?? '').trim();
        const owner = String(form.get('owner') ?? '').trim();
        const plan = String(form.get('plan') ?? '');
        const values = { name, displayName, owner, plan };

        // What the person can fix is said here, in their words; the API checks it all again.
        if (!TENANT_NAME.test(name))
            return fail(400, {
                values,
                message:
                    'The name has 2 to 28 characters: lowercase letters, digits and hyphens, starting with a letter.'
            });
        if (displayName.length > 100)
            return fail(400, { values, message: 'The display name is 100 characters at most.' });
        if (!owner.includes('@'))
            return fail(400, { values, message: 'The owner is an email address.' });
        if (!(plan in PLANS)) return fail(400, { values, message: 'Choose a plan.' });

        const result = await createTenant(event, {
            name,
            owner,
            plan: plan as Plan,
            ...(displayName ? { displayName } : {})
        });
        if (result.ok === false) return fail(result.status, { values, message: result.message });
        // The tenant exists and is being made: its page follows it until it is ready.
        redirect(303, `/t/${name}`);
    }
};
