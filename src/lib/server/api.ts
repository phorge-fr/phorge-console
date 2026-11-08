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

/** The renewals in progress, by session. */
const renewing = new WeakMap<Session, Promise<void>>();

/**
 * Renews the token once, however many calls of the same page ask for it at the same time (the layout and the page of a route
 * load in parallel). The refresh token may be renewed at each use: a second renewal with the old one would be refused and would
 * sign the person out.
 */
function renew(config: NonNullable<ReturnType<typeof getConfig>>, session: Session) {
    let pending = renewing.get(session);
    if (!pending) {
        pending = refresh(config, session).finally(() => renewing.delete(session));
        renewing.set(session, pending);
    }
    return pending;
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
            await renew(config, session);
        } catch {
            destroySession(event.cookies);
            event.locals.session = undefined;
            redirect(303, loginPath(event.url));
        }
    }
    return session;
}

/**
 * Sends a request to the Phorge API as the signed-in person, from the server only. The two cases that are not about this request
 * are handled here: a refused token sends the person to sign in again, and an API that cannot be reached is "unavailable".
 */
async function send(event: RequestEvent, path: string, init: RequestInit): Promise<Response> {
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
    return response;
}

/** The API's own message is meant for people (`{"error": {"code", "message"}}`). */
const messageOf = async (response: Response, fallback: string) =>
    ((await response.json().catch(() => undefined)) as { error?: { message?: string } } | undefined)
        ?.error?.message ?? fallback;

/**
 * Calls the Phorge API for a page and returns the JSON answer. What the API answers is turned into what the console shows:
 * 401 sends the person back to sign in, 403 and 404 say so, and an API that cannot be reached or answers 5xx is "unavailable".
 */
export async function apiJson<T>(
    event: RequestEvent,
    path: string,
    init: RequestInit = {}
): Promise<T> {
    const response = await send(event, path, init);
    if (response.status === 403) error(403, 'You are not allowed to do this.');
    if (response.status === 404) error(404, 'This does not exist, or you cannot see it.');
    if (response.status >= 500) error(503, 'The Phorge API is unavailable. Try again in a moment.');
    if (!response.ok) error(response.status, await messageOf(response, 'The request was refused.'));
    return response.status === 204 ? (undefined as T) : ((await response.json()) as T);
}

export type ApiResult<T> =
    { ok: true; status: number; data: T } | { ok: false; status: number; message: string };

/**
 * Calls the Phorge API for a form: what the person can fix (a bad name, a name already taken, a refusal) comes back as a message
 * to show next to the form, not as an error page. `forbidden` is what a 403 means for this action. Sign-in problems and an API
 * that is down still go through `error` and `redirect`, as in `apiJson`.
 */
export async function apiAction<T>(
    event: RequestEvent,
    path: string,
    init: RequestInit,
    forbidden: string
): Promise<ApiResult<T>> {
    const response = await send(event, path, init);
    if (response.status >= 500) error(503, 'The Phorge API is unavailable. Try again in a moment.');
    if (response.status === 403) return { ok: false, status: 403, message: forbidden };
    if (!response.ok) {
        return {
            ok: false,
            status: response.status,
            message: await messageOf(response, 'The request was refused.')
        };
    }
    const data = response.status === 204 ? undefined : await response.json().catch(() => undefined);
    return { ok: true, status: response.status, data: data as T };
}

/** A request with a JSON body, for `apiAction`. */
export const jsonRequest = (method: string, body: unknown): RequestInit => ({
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
});

/** The caller, as the API sees it (`GET /v1/whoami`). */
export type Identity = {
    kind: 'user' | 'servicekey';
    subject: string;
    email?: string;
    name?: string;
    /** True for a person with an email, false for a key: the API says whether the person may create a tenant. */
    canCreateTenants?: boolean;
};

export const whoami = (event: RequestEvent) => apiJson<Identity>(event, '/v1/whoami');
