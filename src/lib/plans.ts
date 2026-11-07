/** What a plan allows, as the API documents it (the quota is enforced by Incus). */
export const PLANS = {
    small: { instances: 1, vcpu: 2, memoryGiB: 4, diskGiB: 20, networks: 1 },
    medium: { instances: 3, vcpu: 4, memoryGiB: 8, diskGiB: 100, networks: 2 },
    large: { instances: 6, vcpu: 8, memoryGiB: 16, diskGiB: 250, networks: 3 }
} as const;

export type Plan = keyof typeof PLANS;
