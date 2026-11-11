import { NETWORK_NAME } from '#lib/networks';
import { listNetworks } from '#lib/server/networks';
import type { PageServerLoad } from './$types';

// Anybody with a role on the tenant reads the networks. The list is read-only: a network is changed and deleted from its own page.
export const load: PageServerLoad = async (event) => {
    const networks = await listNetworks(event, event.params.tenant);
    // `?deleted=<name>` is where the deletion of a network sends the person: the list says what became of it, whether the platform
    // still shows it as being deleted or has already removed it.
    const asked = event.url.searchParams.get('deleted') ?? '';
    const deleted = NETWORK_NAME.test(asked)
        ? { name: asked, gone: !networks.some((network) => network.name === asked) }
        : undefined;
    return { networks, deleted };
};
