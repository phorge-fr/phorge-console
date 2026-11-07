import { listTenants } from '#lib/server/tenants';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
    const [tenants, parent] = [await listTenants(event), await event.parent()];
    return { tenants, user: parent.user, platformAdmin: parent.platformAdmin };
};
