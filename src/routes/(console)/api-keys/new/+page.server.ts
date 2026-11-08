import { fail } from '@sveltejs/kit';
import { MAX_GRANTS, MAX_NAME_LENGTH, readExpiry, readRules } from '#lib/apikeys';
import { createApiKey } from '#lib/server/apikeys';
import { listTenants } from '#lib/server/tenants';
import type { Actions } from './$types';

export const actions: Actions = {
    // Create a key and show it once. The answer holds the key: it is passed to the page as it is and kept nowhere else, since the
    // API cannot give it again.
    default: async (event) => {
        const form = await event.request.formData();
        const displayName = String(form.get('displayName') ?? '').trim();
        const choice = String(form.get('expires') ?? '');
        const day = String(form.get('expiresOn') ?? '').trim();
        // The tenants a key may be given rights on are the ones the person sees: the names of the form are not trusted.
        const seen = (await listTenants(event)).map((tenant) => tenant.name);
        const { rules, grants } = readRules(form, seen);
        const values = { displayName, expires: choice, expiresOn: day, rules };
        const refuse = (message: string) => fail(400, { values, message });

        if (!displayName || displayName.length > MAX_NAME_LENGTH)
            return refuse(`The name has 1 to ${MAX_NAME_LENGTH} characters.`);
        if (rules.some((rule) => rule.scopes.length === 0 || rule.tenants.length === 0))
            return refuse('Each rule needs at least one right and at least one tenant.');
        if (grants.length === 0)
            return refuse('Add a rule: what the key may do, and on which tenants.');
        if (grants.length > MAX_GRANTS)
            return refuse(
                `A key covers ${MAX_GRANTS} tenants at most: make another key for the others.`
            );
        const expiry = readExpiry(choice, day);
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
