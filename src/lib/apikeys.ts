/** What the API accepts for an API key (`ApiKeyCreate` and `Scope` of the OpenAPI document), shared by the forms and the actions. */

/** What a key may do on a tenant. `instances:write` does not give `instances:read`: each scope is its own. */
export const SCOPES = [
    { scope: 'tenants:read', label: 'See the tenant' },
    { scope: 'instances:read', label: 'See the instances' },
    { scope: 'instances:write', label: 'Create and change instances' },
    { scope: 'images:read', label: 'See the images' },
    { scope: 'images:write', label: 'Pull and delete images' },
    { scope: 'memberships:read', label: 'See the members' },
    { scope: 'memberships:write', label: 'Add and remove members' }
] as const;

export type Scope = (typeof SCOPES)[number]['scope'];

export const MAX_NAME_LENGTH = 100;
export const MAX_GRANTS = 50;

/** The id of a key, as the API gives it (the name of the object). Only used to build an address, so it is checked. */
export const KEY_ID = /^[a-z0-9-]{1,64}$/;

const SCOPE_NAMES = new Set<string>(SCOPES.map((s) => s.scope));
export const isScope = (value: string): value is Scope => SCOPE_NAMES.has(value);

/** The grants of a form: the scopes ticked for each tenant (`scope:<tenant>` fields), without the tenants that have none. */
export function readGrants(form: FormData, tenants: string[]) {
    const grants: { tenant: string; scopes: Scope[] }[] = [];
    for (const tenant of tenants) {
        const scopes = form.getAll(`scope:${tenant}`).map(String).filter(isScope);
        if (scopes.length > 0) grants.push({ tenant, scopes: [...new Set(scopes)] });
    }
    return grants;
}

/**
 * The end of the chosen day, in UTC, as the API wants it, or a sentence that says what is wrong. The API checks that it is in the
 * future and within the maximum lifetime of the deployment, and says so.
 */
export function readExpiry(day: string): { expiresAt: string } | { message: string } {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return { message: 'Choose the day the key expires.' };
    const end = new Date(`${day}T23:59:59Z`);
    if (Number.isNaN(end.getTime())) return { message: 'This is not a date.' };
    if (end.getTime() <= Date.now()) return { message: 'The key must expire in the future.' };
    return { expiresAt: end.toISOString() };
}
