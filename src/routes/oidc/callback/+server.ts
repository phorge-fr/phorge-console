import { error, redirect } from '@sveltejs/kit';
import { getConfig } from '#lib/server/config';
import { finishLogin } from '#lib/server/oidc';
import { createSession, takePending } from '#lib/server/session';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, cookies }) => {
    const config = getConfig();
    if (!config) error(503, 'The console is not configured.');

    // The sign-in of this browser is used once, whatever the outcome.
    const pending = takePending(cookies);
    if (!pending) redirect(303, '/login');
    if (url.searchParams.has('error')) error(403, 'Sign-in was refused.');

    let data;
    try {
        data = await finishLogin(config, url, pending);
    } catch (e) {
        // The reason is for the logs: it never holds a token, a code or a secret.
        console.error('sign-in failed:', e instanceof Error ? e.message : e);
        error(401, 'Sign-in failed. Start again.');
    }
    createSession(cookies, data);
    redirect(303, pending.next);
};
