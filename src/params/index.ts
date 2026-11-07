import { defineParams } from '@sveltejs/kit/params';

// This file is loaded by Node when SvelteKit builds, before the aliases of the app exist: it imports nothing of the app.

/** The name of a tenant, as the Phorge API accepts it (`^[a-z][a-z0-9-]{1,27}$`). */
export const TENANT_NAME = /^[a-z][a-z0-9-]{1,27}$/;

// The param matchers of the routes. `[tenant=tenant]`: a name the API could not have given is a 404 without calling the API.
export const params = defineParams({
    tenant: (param) => (TENANT_NAME.test(param) ? param : undefined)
});
