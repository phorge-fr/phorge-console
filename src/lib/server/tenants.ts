import type { RequestEvent } from '@sveltejs/kit';
import type { Plan } from '#lib/plans';
import { apiJson } from './api';

/** `Provisioning` is being made or changed, `Failed` is not ready after 3 minutes (see `problems`). */
export type Phase = 'Provisioning' | 'Ready' | 'Failed' | 'Deleting';

export type Tenant = {
    name: string;
    displayName?: string;
    owner: string;
    plan: Plan;
    phase?: Phase;
    problems?: string;
    namespace?: string;
    incusProject?: string;
    createdAt?: string;
    createdBy?: string;
};

/** The tenants the caller holds a role on (all of them for a platform administrator), by name. */
export const listTenants = async (event: RequestEvent) =>
    (await apiJson<{ items: Tenant[] }>(event, '/v1/tenants')).items;

export const getTenant = (event: RequestEvent, name: string) =>
    apiJson<Tenant>(event, `/v1/tenants/${encodeURIComponent(name)}`);
