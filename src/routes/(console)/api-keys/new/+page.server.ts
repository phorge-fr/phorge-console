import { fail } from '@sveltejs/kit';
import { MAX_GRANTS, MAX_NAME_LENGTH, readExpiry, readGrants } from '#lib/apikeys';
import { createApiKey } from '#lib/server/apikeys';
import { listTenants } from '#lib/server/tenants';
import type { Actions } from './$types';

export const actions: Actions = {
    // Create a key and show it once. The answer holds the key: it is passed to the page as it is and kept nowhere else, since the
    // API cannot give it again.
    default: async (event) => {
        const form = await event.request.formData();
        const displayName = String(form.get('displayName') ?? '').trim();
        const day = String(form.get('expires') ?? '').trim();
        // The tenants a key may be given rights on are the ones the person sees: the names of the form are not trusted.
        const tenants = (await listTenants(event)).map((tenant) => tenant.name);
        const grants = readGrants(form, tenants);
        const ticked = Object.fromEntries(
            tenants.map((tenant) => [tenant, form.getAll(`scope:${tenant}`).map(String)])
        );
        const values = { displayName, expires: day, ticked };
        const refuse = (message: string) => fail(400, { values, message });

        if (!displayName || displayName.length > MAX_NAME_LENGTH)
            return refuse(`The name has 1 to ${MAX_NAME_LENGTH} characters.`);
        if (grants.length === 0)
            return refuse('Choose at least one thing the key may do, on at least one tenant.');
        if (grants.length > MAX_GRANTS) return refuse(`At most ${MAX_GRANTS} tenants.`);
        const expiry = readExpiry(day);
        if ('message' in expiry) return refuse(expiry.message);

        const result = await createApiKey(event, {
            displayName,
            grants,
            expiresAt: expiry.expiresAt
        });
        if (result.ok === false) return fail(result.status, { values, message: result.message });
        // The key must not be kept by a cache or a proxy either.
        event.setHeaders({ 'cache-control': 'no-store' });
        const { key, identity, id, expiresAt } = result.data;
        return { created: { id, displayName, key, identity, expiresAt } };
    }
};
