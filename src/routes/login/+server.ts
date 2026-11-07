import { error, redirect } from '@sveltejs/kit';
import { getConfig } from '#lib/server/config';
import { safeNext } from '#lib/server/next';
import { beginLogin } from '#lib/server/oidc';
import { startPending } from '#lib/server/session';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, cookies, locals }) => {
    const config = getConfig();
    if (!config) error(503, 'The console is not configured.');
    const next = safeNext(url.searchParams.get('next'));
    if (locals.session) redirect(303, next);

    let authorizationUrl: URL;
    try {
        const login = await beginLogin(config, url.origin, next);
        startPending(cookies, login.pending);
        authorizationUrl = login.url;
    } catch (e) {
        // The reason is for the logs, with what caused it (a network error says which): it never holds a token or a secret.
        const cause = e instanceof Error && e.cause instanceof Error ? ` (${e.cause.message})` : '';
        console.error('sign-in could not start:', e instanceof Error ? e.message : e, cause);
        error(503, 'Sign-in is unavailable. Try again in a moment.');
    }
    // Only the origin of the identity provider is allowed as a destination outside this site.
    redirect(303, authorizationUrl.href, { external: [new URL(config.issuer).origin] });
};
