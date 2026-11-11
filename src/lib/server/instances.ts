import type { RequestEvent } from '@sveltejs/kit';
import { apiAction, apiJson, jsonRequest } from './api';
import type { Phase } from './tenants';

export type InstanceNetwork = { name: string; ipv4?: string; ipv6?: string };

export type Instance = {
    name: string;
    /** The image of the tenant it started from. It cannot change. */
    image: string;
    /**
     * The networks of the tenant it is attached to, one NIC each in this order (`eth0`, `eth1`, ...), with the addresses Incus
     * reports on each (absent until the VM has them). The deprecated `network` of the answer is not read.
     */
    networks?: InstanceNetwork[];
    /** The profile it has for its size, when it has one: then `cpu`, `memoryMiB` and `diskGiB` are what the profile comes to. */
    profile?: string;
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
    /** The address on the first network. The others are in `networks`. */
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
    /** 1 to 8 `Ready` networks of the tenant, one NIC each in this order. It can be left out when the tenant has exactly one. */
    networks?: string[];
    /** The size of the instance: a profile of the tenant, or `cpu`, `memoryMiB` and `diskGiB`, never both. */
    profile?: string;
    cpu?: number;
    memoryMiB?: number;
    diskGiB?: number;
    running?: boolean;
    nesting?: boolean;
    secureBoot?: boolean;
    sshPublicKeys?: string[];
};

export type InstancePatch = {
    /** Moves the instance to a profile. To leave one, give `cpu`, `memoryMiB` and `diskGiB` together. */
    profile?: string;
    running?: boolean;
    cpu?: number;
    memoryMiB?: number;
    diskGiB?: number;
    sshPublicKeys?: string[];
    /** Replaces the list of networks, live: the VM is not stopped or restarted. One that joins must exist and be `Ready`. */
    networks?: string[];
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
 * The answer is 202: the instance is `Provisioning` for about a minute. A limit of the plan is refused at once, with 409
 * `quota_exceeded` and a message that says which; a network that is not ready is 409 `network_not_ready`.
 */
export const createInstance = (event: RequestEvent, tenant: string, instance: InstanceCreate) =>
    apiAction<Instance>(event, base(tenant), jsonRequest('POST', instance), NOT_USER);

/**
 * Starts, stops, resizes, or changes the SSH keys. A VM that was started a moment ago cannot be stopped yet: the API answers 409
 * and says how long to wait. Lowering the memory of a running VM, by `memoryMiB` or by a smaller profile, is refused with 409
 * and the code `running`, and a sentence that says to stop the instance first. The console shows that sentence as it is.
 * A change of size never changes the power state: nothing here stops, resizes and starts behind one action.
 * `networks` replaces the list of networks of the instance, live: the API plugs and unplugs the NICs and does not stop the VM.
 * A network that is not `Ready` is refused with 409 `network_not_ready`.
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
