import type { Handle } from '@sveltejs/kit/hooks';
import { getSession } from '#lib/server/session';

export const handle: Handle = async ({ event, resolve }) => {
    event.locals.session = getSession(event.cookies);
    const response = await resolve(event);
    // Everything rendered by this server is the console: it is not indexed and a signed-in page is not cached.
    // The showcase pages are prerendered and served as files, so these headers do not reach them.
    response.headers.set('x-robots-tag', 'noindex');
    if (event.locals.session) response.headers.set('cache-control', 'no-store');
    return response;
};
