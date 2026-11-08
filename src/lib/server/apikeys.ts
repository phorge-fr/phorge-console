import type { RequestEvent } from '@sveltejs/kit';
import type { Scope } from '#lib/apikeys';
import { apiAction, apiJson, jsonRequest } from './api';
import type { Phase } from './tenants';

export type ApiKey = {
    id: string;
    owner: string;
    displayName: string;
    grants: { tenant: string; scopes: Scope[] }[];
    /** The user name of the service account, to exchange the key for a token at Authentik. */
    identity: string;
    expiresAt?: string;
    /** The date has passed: the key then grants nothing. */
    expired: boolean;
    phase: Phase;
    problems?: string;
    createdAt: string;
    /** The key itself, the password of the service account. In the answer to the creation only, never again. */
    key?: string;
};

/** The keys of the person, by name. Only a person signed in manages keys, never a key. */
export const listApiKeys = async (event: RequestEvent) =>
    (await apiJson<{ items: ApiKey[] }>(event, '/v1/apikeys')).items;

const NOT_ALLOWED = 'Only platform administrators can create API keys for now.';

/**
 * Creates the service account and answers with the key, once: it is read from the cluster as it is sent and cannot be shown again,
 * so the caller must show it to the person at once and keep it nowhere (not in the session, not in a log).
 */
export const createApiKey = (
    event: RequestEvent,
    key: { displayName: string; grants: { tenant: string; scopes: Scope[] }[]; expiresAt: string }
) => apiAction<ApiKey>(event, '/v1/apikeys', jsonRequest('POST', key), NOT_ALLOWED);

/** Only the name of a key changes. What it may do and until when are fixed: to change them, revoke it and create another. */
export const renameApiKey = (event: RequestEvent, id: string, displayName: string) =>
    apiAction<ApiKey>(
        event,
        `/v1/apikeys/${encodeURIComponent(id)}`,
        jsonRequest('PATCH', { displayName }),
        'This key is not yours.'
    );

/** The key stops working at once. Anybody revokes their own keys. */
export const revokeApiKey = (event: RequestEvent, id: string) =>
    apiAction<ApiKey>(
        event,
        `/v1/apikeys/${encodeURIComponent(id)}`,
        { method: 'DELETE' },
        'This key is not yours.'
    );
