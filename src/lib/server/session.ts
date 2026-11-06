import { dev } from '$app/env';
import type { Cookies } from '@sveltejs/kit';

/**
 * Sessions live in the memory of this server. The browser only holds an opaque identifier, so no token
 * reaches it. A restart signs everybody out, and the console must run as one replica until the store is
 * shared (see docs/explanation/how-the-console-signs-people-in.md).
 */

export type User = {
    /** The `sub` claim of Authentik. */
    sub: string;
    email: string;
    name?: string;
};

export type Session = {
    id: string;
    user: User;
    idToken?: string;
    accessToken: string;
    /** When the access token expires, in milliseconds since the epoch. */
    accessExpiresAt: number;
    refreshToken?: string;
    /** The session ends here whatever the tokens say. */
    expiresAt: number;
};

/** What a sign-in in progress remembers between the redirect to Authentik and the callback. */
export type PendingLogin = {
    state: string;
    nonce: string;
    verifier: string;
    next: string;
    expiresAt: number;
};

export const SESSION_COOKIE = 'phorge_session';
export const LOGIN_COOKIE = 'phorge_login';

const SESSION_MAX_AGE_MS = 8 * 60 * 60 * 1000;
const LOGIN_MAX_AGE_MS = 10 * 60 * 1000;

const sessions = new Map<string, Session>();
const pending = new Map<string, PendingLogin>();

/** 256 random bits, base64url: unguessable, and safe in a cookie. */
function newId() {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    return btoa(String.fromCharCode(...bytes))
        .replaceAll('+', '-')
        .replaceAll('/', '_')
        .replaceAll('=', '');
}

function sweep(now: number) {
    for (const [id, s] of sessions) if (s.expiresAt <= now) sessions.delete(id);
    for (const [id, p] of pending) if (p.expiresAt <= now) pending.delete(id);
}

const cookieOptions = (maxAgeMs: number) => ({
    path: '/',
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: !dev,
    maxAge: Math.floor(maxAgeMs / 1000)
});

export function createSession(cookies: Cookies, data: Omit<Session, 'id' | 'expiresAt'>): Session {
    const now = Date.now();
    sweep(now);
    const session: Session = { ...data, id: newId(), expiresAt: now + SESSION_MAX_AGE_MS };
    sessions.set(session.id, session);
    cookies.set(SESSION_COOKIE, session.id, cookieOptions(SESSION_MAX_AGE_MS));
    return session;
}

export function getSession(cookies: Cookies): Session | undefined {
    const id = cookies.get(SESSION_COOKIE);
    if (!id) return undefined;
    const session = sessions.get(id);
    if (!session) return undefined;
    if (session.expiresAt <= Date.now()) {
        sessions.delete(id);
        return undefined;
    }
    return session;
}

export function destroySession(cookies: Cookies) {
    const id = cookies.get(SESSION_COOKIE);
    if (id) sessions.delete(id);
    cookies.delete(SESSION_COOKIE, { path: '/' });
}

export function startPending(cookies: Cookies, login: Omit<PendingLogin, 'expiresAt'>) {
    const now = Date.now();
    sweep(now);
    const id = newId();
    pending.set(id, { ...login, expiresAt: now + LOGIN_MAX_AGE_MS });
    // The cookie ties the callback to the browser that started the sign-in.
    cookies.set(LOGIN_COOKIE, id, cookieOptions(LOGIN_MAX_AGE_MS));
}

/** Returns the sign-in in progress of this browser, once: a callback cannot be replayed. */
export function takePending(cookies: Cookies): PendingLogin | undefined {
    const id = cookies.get(LOGIN_COOKIE);
    cookies.delete(LOGIN_COOKIE, { path: '/' });
    if (!id) return undefined;
    const login = pending.get(id);
    pending.delete(id);
    if (!login || login.expiresAt <= Date.now()) return undefined;
    return login;
}
