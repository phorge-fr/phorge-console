/**
 * What a plan allows, as the API documents it. It is a description for the person who chooses a plan: what a tenant really has
 * and uses is read from its quota (`GET /v1/tenants/{t}/quota`). The vCPU, the memory and the disk of each plan hold two
 * virtual machines of the size of its own profile (`small`: s, `medium`: m, `large`: l).
 */
export const PLANS = {
    small: { instances: 2, vcpu: 2, memoryGiB: 4, diskGiB: 128, networks: 1 },
    medium: { instances: 4, vcpu: 4, memoryGiB: 8, diskGiB: 256, networks: 2 },
    large: { instances: 6, vcpu: 8, memoryGiB: 16, diskGiB: 512, networks: 3 }
} as const;

export type Plan = keyof typeof PLANS;
