import type { RequestEvent } from '@sveltejs/kit';
import { apiAction, apiJson, jsonRequest } from './api';
import type { Phase } from './tenants';

export type Instance = {
    name: string;
    /** The image of the tenant it started from. It cannot change. */
    image: string;
    cpu: number;
    memoryMiB: number;
    diskGiB: number;
    /** What is asked for: `true` starts the VM, `false` stops the same VM. */
    running: boolean;
    nesting: boolean;
    secureBoot: boolean;
    sshPublicKeys: string[];
    /** What Incus reports, once the VM exists. */
    state?: string;
    /** What the VM is doing while its state is not the one `running` asks for. */
    transition?: 'starting' | 'stopping';
    transitionSince?: string;
    /** The address on the network of the tenant. */
    ipv4?: string;
    phase: Phase;
    /** What is wrong, as Incus says it (a quota that is reached, an image that does not boot). */
    problems?: string;
    createdAt: string;
    createdBy?: string;
};

export type InstanceCreate = {
    name: string;
    image: string;
    cpu?: number;
    memoryMiB?: number;
    diskGiB?: number;
    running?: boolean;
    nesting?: boolean;
    secureBoot?: boolean;
    sshPublicKeys?: string[];
};

export type InstancePatch = {
    running?: boolean;
    cpu?: number;
    memoryMiB?: number;
    diskGiB?: number;
    sshPublicKeys?: string[];
};

const base = (tenant: string) => `/v1/tenants/${encodeURIComponent(tenant)}/instances`;
const one = (tenant: string, name: string) => `${base(tenant)}/${encodeURIComponent(name)}`;

const NOT_USER =
    'Only users, operators and administrators of this tenant can change virtual machines.';

/** The virtual machines of a tenant, by name. Anybody with a role on the tenant reads them. */
export const listInstances = async (event: RequestEvent, tenant: string) =>
    (await apiJson<{ items: Instance[] }>(event, base(tenant))).items;

export const getInstance = (event: RequestEvent, tenant: string, name: string) =>
    apiJson<Instance>(event, one(tenant, name));

/**
 * The answer is 202: the instance is `Provisioning` for about a minute. The quota of the plan is Incus's, not the request's: a
 * refusal comes back later as the `problems` of the instance, which becomes `Failed` after three minutes.
 */
export const createInstance = (event: RequestEvent, tenant: string, instance: InstanceCreate) =>
    apiAction<Instance>(event, base(tenant), jsonRequest('POST', instance), NOT_USER);

/**
 * Starts, stops, resizes, or changes the SSH keys, applied live. A VM that was started a moment ago cannot be stopped yet: the
 * API answers 409 and says how long to wait.
 */
export const patchInstance = (
    event: RequestEvent,
    tenant: string,
    name: string,
    patch: InstancePatch
) => apiAction<Instance>(event, one(tenant, name), jsonRequest('PATCH', patch), NOT_USER);

/** The VM and its disk are destroyed. The answer is 202: the instance is `Deleting` until everything it is made of is gone. */
export const deleteInstance = (event: RequestEvent, tenant: string, name: string) =>
    apiAction<undefined>(event, one(tenant, name), { method: 'DELETE' }, NOT_USER);
