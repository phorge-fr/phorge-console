import type { RequestEvent } from '@sveltejs/kit';
import { apiAction, apiJson, jsonRequest as json } from './api';

/** `Provisioning` is being made or changed, `Failed` is not ready after 3 minutes (see `problems`). */
export type Phase = 'Provisioning' | 'Ready' | 'Failed' | 'Deleting';

export type Tenant = {
    name: string;
    displayName?: string;
    owner: string;
    phase?: Phase;
    problems?: string;
    namespace?: string;
    incusProject?: string;
    createdAt?: string;
    createdBy?: string;
};

/** The tenants the caller holds a role on, by name. There is no view of the others. */
export const listTenants = async (event: RequestEvent) =>
    (await apiJson<{ items: Tenant[] }>(event, '/v1/tenants')).items;

export const getTenant = (event: RequestEvent, name: string) =>
    apiJson<Tenant>(event, `/v1/tenants/${encodeURIComponent(name)}`);

const NOT_ADMIN = 'Only the administrators of this tenant can do this.';

/**
 * The person is the owner and every tenant has the same limits. The API answers 202: the tenant exists and is `Provisioning` for about a
 * minute. Past the number of tenants a person may own it answers 409 `quota_exceeded`, with a message to show as it is.
 */
export const createTenant = (event: RequestEvent, tenant: { name: string; displayName?: string }) =>
    apiAction<Tenant>(event, '/v1/tenants', json('POST', tenant), 'You cannot create a tenant.');

/** The administrators of the tenant change its display name; the name and the owner cannot change, */
export const patchTenant = (event: RequestEvent, name: string, patch: { displayName?: string }) =>
    apiAction<Tenant>(
        event,
        `/v1/tenants/${encodeURIComponent(name)}`,
        json('PATCH', patch),
        NOT_ADMIN
    );

/** The administrators of the tenant, its owner included. It destroys the virtual machines of the tenant. The answer is 202: the tenant is `Deleting` until it is gone. */
export const deleteTenant = (event: RequestEvent, name: string) =>
    apiAction<undefined>(
        event,
        `/v1/tenants/${encodeURIComponent(name)}`,
        { method: 'DELETE' },
        NOT_ADMIN
    );

/** The tenant as the API has it now, or `undefined` when it is gone (or not visible any more). */
export async function tenantNow(event: RequestEvent, name: string): Promise<Tenant | undefined> {
    const result = await apiAction<Tenant>(
        event,
        `/v1/tenants/${encodeURIComponent(name)}`,
        {},
        'You are not allowed to see this tenant.'
    );
    return result.ok ? result.data : undefined;
}
