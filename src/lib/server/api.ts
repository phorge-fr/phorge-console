import { error, redirect, type RequestEvent } from '@sveltejs/kit';
import { getConfig } from './config';
import { refresh } from './oidc';
import { destroySession, type Session } from './session';

/** The access token is renewed when it has less than this left. */
const RENEW_MARGIN_MS = 30_000;

/** Where to send a person who has to sign in again, and bring them back here after. */
export function loginPath(url: URL) {
    return `/login?next=${encodeURIComponent(url.pathname + url.search)}`;
}

/**
 * A signed-in session with an access token that is still good, or a redirect to the sign-in page.
 * The token is renewed with the refresh token when it is about to expire.
 */
async function freshSession(event: RequestEvent): Promise<Session> {
    const session = event.locals.session;
    const config = getConfig();
    if (!session || !config) redirect(303, loginPath(event.url));
    if (session.accessExpiresAt - Date.now() < RENEW_MARGIN_MS) {
        try {
            await refresh(config, session);
        } catch {
            destroySession(event.cookies);
            event.locals.session = undefined;
            redirect(303, loginPath(event.url));
        }
    }
    return session;
}

/**
 * Calls the Phorge API as the signed-in person, from the server only, and returns the JSON answer.
 * What the API answers is turned into what the console shows: 401 sends the person back to sign in,
 * 403 and 404 say so, and an API that cannot be reached or answers 5xx is "unavailable".
 */
export async function apiJson<T>(
    event: RequestEvent,
    path: string,
    init: RequestInit = {}
): Promise<T> {
    const config = getConfig();
    const session = await freshSession(event);
    let response: Response;
    try {
        response = await event.fetch(`${config!.apiUrl}${path}`, {
            ...init,
            headers: {
                accept: 'application/json',
                ...init.headers,
                authorization: `Bearer ${session.accessToken}`
            }
        });
    } catch {
        error(503, 'The Phorge API cannot be reached. Try again in a moment.');
    }

    if (response.status === 401) {
        destroySession(event.cookies);
        event.locals.session = undefined;
        redirect(303, loginPath(event.url));
    }
    if (response.status === 403) error(403, 'You are not allowed to do this.');
    if (response.status === 404) error(404, 'This does not exist, or you cannot see it.');
    if (response.status >= 500) error(503, 'The Phorge API is unavailable. Try again in a moment.');
    if (!response.ok) {
        // The API's own message is meant for people (`{"error": {"code", "message"}}`).
        const body = await response.json().catch(() => undefined);
        error(response.status, body?.error?.message ?? 'The request was refused.');
    }
    return response.status === 204 ? (undefined as T) : ((await response.json()) as T);
}

/** The caller, as the API sees it (`GET /v1/whoami`). */
export type Identity = {
    kind: 'user' | 'servicekey';
    subject: string;
    email?: string;
    name?: string;
    platformAdmin?: boolean;
};

export const whoami = (event: RequestEvent) => apiJson<Identity>(event, '/v1/whoami');
