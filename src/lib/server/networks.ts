import type { RequestEvent } from '@sveltejs/kit';
import { apiAction, apiJson, jsonRequest } from './api';
import type { Phase } from './tenants';

export type Network = {
    name: string;
    description?: string;
    /**
     * The range of the network (CIDR): the one the person chose or the one Incus chose. Absent while it is not known, which is
     * not an error. Right after the creation it is there only if the person chose it.
     */
    ipv4?: string;
    phase: Phase;
    /** What is wrong, in a sentence made for the person (a limit of the plan that is reached). */
    problems?: string;
    createdAt: string;
    createdBy?: string;
};

const base = (tenant: string) => `/v1/tenants/${encodeURIComponent(tenant)}/networks`;

/** The networks of a tenant, by name. A tenant comes without any: its people deploy the ones they need. Any role reads them. */
export const listNetworks = async (event: RequestEvent, tenant: string) =>
    (await apiJson<{ items: Network[] }>(event, base(tenant))).items;

const NOT_OPERATOR =
    'Only operators and administrators of this tenant can create or delete networks.';

/**
 * The answer is 202: the network is `Provisioning` until it is deployed. The plan limits the number of networks: past it the
 * API refuses with 409 `quota_exceeded`, and a message that says so. A range that is reserved or already used is refused with
 * 409 `range_reserved` or `range_in_use`, and a range of a wrong shape with 422: the messages are shown as they are.
 */
export const createNetwork = (
    event: RequestEvent,
    tenant: string,
    network: { name: string; description?: string; ipv4?: string }
) => apiAction<Network>(event, base(tenant), jsonRequest('POST', network), NOT_OPERATOR);

/**
 * The answer is 202. While an instance is attached to the network the API answers 409 and names the instances in its message;
 * for a few seconds after the last one is gone it still refuses, with a 409 that names nobody.
 */
export const deleteNetwork = (event: RequestEvent, tenant: string, name: string) =>
    apiAction<undefined>(
        event,
        `${base(tenant)}/${encodeURIComponent(name)}`,
        { method: 'DELETE' },
        NOT_OPERATOR
    );
