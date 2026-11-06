import { isRedirect, redirect } from '@sveltejs/kit';
import { getConfig } from '#lib/server/config';
import { endSessionUrl } from '#lib/server/oidc';
import { destroySession } from '#lib/server/session';
import type { RequestHandler } from './$types';

// POST only: a link or an image on another site cannot sign anybody out.
export const POST: RequestHandler = async ({ url, cookies, locals }) => {
    const idToken = locals.session?.idToken;
    destroySession(cookies);
    locals.session = undefined;

    const config = getConfig();
    if (config) {
        try {
            const end = await endSessionUrl(config, url.origin, idToken);
            if (end) redirect(303, end.href, { external: [new URL(config.issuer).origin] });
        } catch (e) {
            // A redirect is thrown as an exception too: let it through.
            if (isRedirect(e)) throw e;
            console.error(
                'sign-out at the identity provider failed:',
                e instanceof Error ? e.message : e
            );
        }
    }
    redirect(303, '/');
};
