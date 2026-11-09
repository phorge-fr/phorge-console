import type { Handle } from '@sveltejs/kit/hooks';
import { getSession } from '#lib/server/session';
// Registers the handler of the websocket of the terminal, which `server.js` and the development server call.
import '#lib/server/terminal';

export const handle: Handle = async ({ event, resolve }) => {
    event.locals.session = getSession(event.cookies);
    const response = await resolve(event);
    // Everything rendered by this server is the console: it is not indexed and a signed-in page is not cached.
    response.headers.set('x-robots-tag', 'noindex');
    if (event.locals.session) response.headers.set('cache-control', 'no-store');
    return response;
};
