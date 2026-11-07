import { error, isHttpError, redirect } from '@sveltejs/kit';
import { loginPath, whoami } from '#lib/server/api';
import { getConfig } from '#lib/server/config';
import { listTenants } from '#lib/server/tenants';
import type { LayoutServerLoad } from './$types';

// Every page of the console needs a signed-in person, and the frame shows the tenants they can switch to.
export const load: LayoutServerLoad = async (event) => {
    if (!getConfig()) error(503, 'The console is not configured.');
    if (!event.locals.session) redirect(303, loginPath(event.url));

    // The frame must stay up when the list cannot be had, so the person can still sign out: only a sign-in problem (a redirect)
    // goes through, any other failure becomes a notice and the page that needs the API says so itself.
    let tenants;
    let notice: string | undefined;
    // Who the API takes the person for decides what is offered: creating, resizing and deleting tenants is for platform
    // administrators. This only hides what would be refused; the API refuses it either way.
    let platformAdmin = false;
    const [tenantsResult, identity] = await Promise.allSettled([listTenants(event), whoami(event)]);
    if (tenantsResult.status === 'fulfilled') tenants = tenantsResult.value;
    else if (isHttpError(tenantsResult.reason)) notice = tenantsResult.reason.body.message;
    else throw tenantsResult.reason;
    if (identity.status === 'fulfilled') platformAdmin = identity.value.platformAdmin === true;
    else if (!isHttpError(identity.reason)) throw identity.reason;
    return { user: event.locals.session.user, tenants, notice, platformAdmin };
};
