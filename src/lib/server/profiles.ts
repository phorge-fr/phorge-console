import type { RequestEvent } from '@sveltejs/kit';
import { apiAction, apiJson, jsonRequest } from './api';
import type { Phase } from './tenants';

export type Profile = {
    name: string;
    description?: string;
    cpu: number;
    memoryMiB: number;
    diskGiB: number;
    /** Absent when the profile does not say it: that is not `false`. An instance that says its own value keeps it. */
    secureBoot?: boolean;
    /** Absent when the profile has none. The keys of an instance replace these, they do not add to them. */
    sshPublicKeys?: string[];
    /** `s`, `m` and `l`: every tenant has them, and they cannot be changed or deleted. */
    builtin: boolean;
    /** Only for the profiles a user made. */
    phase?: Phase;
    /** What is wrong, in a sentence made for the person. */
    problems?: string;
    createdAt?: string;
    createdBy?: string;
};

const base = (tenant: string) => `/v1/tenants/${encodeURIComponent(tenant)}/profiles`;

export const getProfile = (event: RequestEvent, tenant: string, name: string) =>
    apiJson<Profile>(event, `${base(tenant)}/${encodeURIComponent(name)}`);

/** The profiles of a tenant: the three of every tenant first, then the others by name. Any role of the tenant reads them. */
export const listProfiles = async (event: RequestEvent, tenant: string) =>
    (await apiJson<{ items: Profile[] }>(event, base(tenant))).items;

const NOT_OPERATOR =
    'Only operators and administrators of this tenant can create or delete profiles.';

/**
 * The answer is 202: the profile is `Provisioning` until it is made. A tenant holds a limited number of them: past it the API
 * answers 409 `quota_exceeded`. There is no change: to change a profile, make another and move the instances.
 */
export const createProfile = (
    event: RequestEvent,
    tenant: string,
    profile: {
        name: string;
        description?: string;
        cpu: number;
        memoryMiB: number;
        diskGiB: number;
        /** Left out when the person did not choose: the profile then does not say it. */
        secureBoot?: boolean;
        /** Left out when no key was typed. */
        sshPublicKeys?: string[];
    }
) => apiAction<Profile>(event, base(tenant), jsonRequest('POST', profile), NOT_OPERATOR);

/**
 * The answer is 202. While an instance has the profile the API answers 409 and names the instances in its message; for a few
 * seconds after the last one is gone it still refuses, with a 409 that names nobody. `s`, `m` and `l` answer 403.
 */
export const deleteProfile = (event: RequestEvent, tenant: string, name: string) =>
    apiAction<undefined>(
        event,
        `${base(tenant)}/${encodeURIComponent(name)}`,
        { method: 'DELETE' },
        NOT_OPERATOR
    );
