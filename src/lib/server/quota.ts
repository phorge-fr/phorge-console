import type { RequestEvent } from '@sveltejs/kit';
import { apiJson } from './api';

/** The five figures of a quota, for the limits of the plan and for what the tenant holds. */
export type QuotaFigures = {
    instances: number;
    vcpu: number;
    memoryMiB: number;
    diskGiB: number;
    networks: number;
};

export type Quota = {
    plan: 'small' | 'medium' | 'large';
    limits: QuotaFigures;
    used: QuotaFigures;
};

/**
 * What the plan of a tenant allows and what the tenant holds. A stopped instance counts, as it does for Incus. Any role of the
 * tenant reads it. A request past a limit is refused with 409 `quota_exceeded`, which the forms show as the API says it.
 */
export const getQuota = (event: RequestEvent, tenant: string) =>
    apiJson<Quota>(event, `/v1/tenants/${encodeURIComponent(tenant)}/quota`);
