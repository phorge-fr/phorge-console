import { getTenant } from '#lib/server/tenants';
import type { LayoutServerLoad } from './$types';

// The tenant of the address. A tenant that does not exist and one the person cannot see both answer 404, which is what the API says.
export const load: LayoutServerLoad = async (event) => ({
    tenant: await getTenant(event, event.params.tenant)
});
