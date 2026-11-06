import { error, redirect } from '@sveltejs/kit';
import { loginPath } from '#lib/server/api';
import { getConfig } from '#lib/server/config';
import type { LayoutServerLoad } from './$types';

// Every page of the console needs a signed-in person.
export const load: LayoutServerLoad = ({ locals, url }) => {
    if (!getConfig()) error(503, 'The console is not configured.');
    if (!locals.session) redirect(303, loginPath(url));
    return { user: locals.session.user };
};
