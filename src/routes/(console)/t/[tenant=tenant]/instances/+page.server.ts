import { listInstances } from '#lib/server/instances';
import type { PageServerLoad } from './$types';

// Anybody with a role on the tenant reads the instances; changing them is for users, operators and administrators, which the API decides.
export const load: PageServerLoad = async (event) => ({
    instances: await listInstances(event, event.params.tenant)
});
