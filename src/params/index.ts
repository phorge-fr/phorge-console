import { defineParams } from '@sveltejs/kit/params';

// This file is loaded by Node when SvelteKit builds, before the aliases of the app exist: it imports nothing of the app.

/** The name of a tenant, as the Phorge API accepts it (`^[a-z][a-z0-9-]{1,27}$`). */
export const TENANT_NAME = /^[a-z][a-z0-9-]{1,27}$/;

/** The name of an instance, as the Phorge API accepts it (`^[a-z]([a-z0-9-]{0,61}[a-z0-9])?$`). */
export const INSTANCE_NAME = /^[a-z]([a-z0-9-]{0,61}[a-z0-9])?$/;

/** The name of a network, as the Phorge API accepts it (`^[a-z]([a-z0-9-]{0,13}[a-z0-9])?$`). */
export const NETWORK_NAME = /^[a-z]([a-z0-9-]{0,13}[a-z0-9])?$/;

/** The name of an image, as the Phorge API accepts it (`^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$`). */
export const IMAGE_NAME = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;

// The param matchers of the routes. `[tenant=tenant]`, `[name=instance]`, `[name=network]`, `[name=image]`: a name the API could not have given is a 404 without calling the API.
export const params = defineParams({
    tenant: (param) => (TENANT_NAME.test(param) ? param : undefined),
    // `new` is the creation page of the instances, not an instance.
    instance: (param) => (INSTANCE_NAME.test(param) && param !== 'new' ? param : undefined),
    // `new` is the creation page of the networks, not a network.
    network: (param) => (NETWORK_NAME.test(param) && param !== 'new' ? param : undefined),
    // `new` is the pull page of the images, not an image.
    image: (param) => (IMAGE_NAME.test(param) && param !== 'new' ? param : undefined)
});
