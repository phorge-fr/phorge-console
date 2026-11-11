import type { RequestEvent } from '@sveltejs/kit';
import { apiJson } from './api';

/** The six figures of a quota, for the limits every tenant has and for what the tenant holds. */
export type QuotaFigures = {
    instances: number;
    vcpu: number;
    memoryMiB: number;
    diskGiB: number;
    networks: number;
    /** The profiles its users made; `s`, `m` and `l` are not counted. */
    profiles: number;
};

export type Quota = {
    limits: QuotaFigures;
    used: QuotaFigures;
};

/**
 * What every tenant is allowed (the same limits for all) and what this tenant holds. A stopped instance counts, as it does for Incus. Any role of the
 * tenant reads it. A request past a limit is refused with 409 `quota_exceeded`, which the forms show as the API says it.
 */
export const getQuota = (event: RequestEvent, tenant: string) =>
    apiJson<Quota>(event, `/v1/tenants/${encodeURIComponent(tenant)}/quota`);
