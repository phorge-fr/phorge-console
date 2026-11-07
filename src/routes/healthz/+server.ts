import type { RequestHandler } from './$types';

// The probe of the container: the process is up and the server answers. It does not need the sign-in settings and does not call
// Authentik or the API, so a slow identity provider never gets the console restarted.
export const GET: RequestHandler = () =>
    new Response('ok\n', {
        headers: { 'content-type': 'text/plain', 'cache-control': 'no-store' }
    });
