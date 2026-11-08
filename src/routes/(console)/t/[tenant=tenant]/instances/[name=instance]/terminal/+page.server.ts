import { getInstance } from '#lib/server/instances';
import type { PageServerLoad } from './$types';

// Only the instance, to say where the terminal is and whether it can open one. The websocket is not a SvelteKit route (see
// `server.js`), and the API decides who may open it.
export const load: PageServerLoad = async (event) => ({
    instance: await getInstance(event, event.params.tenant, event.params.name)
});
