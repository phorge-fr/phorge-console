import { fail, redirect } from '@sveltejs/kit';
import { NETWORK_NAME } from '#lib/networks';
import { isConfirmed } from '#lib/server/confirm';
import { deleteNetwork, listNetworks } from '#lib/server/networks';
import type { Actions, PageServerLoad } from './$types';

// Anybody with a role on the tenant reads the networks; creating and deleting are for operators and administrators, which the API decides.
export const load: PageServerLoad = async (event) => {
    const networks = await listNetworks(event, event.params.tenant);
    // `?delete=<network>` asks for the confirmation of a deletion: the page shows it without needing JavaScript.
    const asked = event.url.searchParams.get('delete');
    return {
        networks,
        confirm: networks.find((network) => network.name === asked && network.phase !== 'Deleting')
            ?.name
    };
};

export const actions: Actions = {
    // Delete a network. Nothing happens unless the exact name was typed. The name comes in the address of the action (`?/delete&network=`).
    delete: async (event) => {
        const network = event.url.searchParams.get('network') ?? '';
        if (!NETWORK_NAME.test(network))
            return fail(400, { remove: { network, message: 'No such network.' } });
        if (!isConfirmed(await event.request.formData(), network))
            return fail(400, {
                remove: { network, message: `The name you typed is not ${network}.` }
            });
        const result = await deleteNetwork(event, event.params.tenant, network);
        if (result.ok === false)
            return fail(result.status, { remove: { network, message: result.message } });
        redirect(303, `/t/${event.params.tenant}/networks`);
    }
};
