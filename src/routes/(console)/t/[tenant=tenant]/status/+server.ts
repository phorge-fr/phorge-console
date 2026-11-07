import { json } from '@sveltejs/kit';
import { tenantNow } from '#lib/server/tenants';
import type { RequestHandler } from './$types';

// What the page of a tenant polls while the tenant is being made or deleted: the state, or that it is gone. Nothing else of the
// tenant leaves through here, and the tokens never do.
export const GET: RequestHandler = async (event) => {
    const tenant = await tenantNow(event, event.params.tenant);
    return json(
        tenant
            ? { gone: false, phase: tenant.phase ?? null, problems: tenant.problems ?? null }
            : { gone: true },
        { headers: { 'cache-control': 'no-store' } }
    );
};
