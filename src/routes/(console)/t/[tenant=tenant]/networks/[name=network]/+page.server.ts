import { fail, redirect } from '@sveltejs/kit';
import { isIpv4Cidr, isIpv6Cidr, MAX_NETWORK_DESCRIPTION_LENGTH } from '#lib/networks';
import { isConfirmed } from '#lib/server/confirm';
import { deleteNetwork, getNetwork, patchNetwork, type NetworkPatch } from '#lib/server/networks';
import type { Actions, PageServerLoad } from './$types';

// Anybody with a role on the tenant reads the network; changing it is for operators and administrators, which the API decides.
export const load: PageServerLoad = async (event) => ({
    network: await getNetwork(event, event.params.tenant, event.params.name)
});

export const actions: Actions = {
    // Change the description and the ranges. Only what differs from the network is sent: what is absent stays. A range that the
    // network has cannot be removed, so an emptied field is sent as it is and the API says so (422). A new IPv4 range while an
    // instance runs on the network is refused by the API (409, `running`) and its sentence names the instances: it is shown as
    // it is, and the console never stops an instance to make the change possible.
    save: async (event) => {
        const form = await event.request.formData();
        const description = String(form.get('description') ?? '').trim();
        const ipv4 = String(form.get('ipv4') ?? '').trim();
        const ipv6 = String(form.get('ipv6') ?? '').trim();
        const values = { description, ipv4, ipv6 };
        const refuse = (message: string, status = 400) => fail(status, { values, message });

        // What the person can fix is said here, in their words; the API checks it all again.
        if (description.length > MAX_NETWORK_DESCRIPTION_LENGTH)
            return refuse(
                `The description has ${MAX_NETWORK_DESCRIPTION_LENGTH} characters at most.`
            );
        if (ipv4 && !isIpv4Cidr(ipv4))
            return refuse(
                'The range is written like 10.77.1.0/24: four numbers, a slash and the length of the prefix.'
            );
        if (ipv6 && !isIpv6Cidr(ipv6))
            return refuse(
                'The IPv6 range is written like fd42:1:2:3::/64: an address, a slash and the length of the prefix.'
            );

        // The network as the API has it now, so that what is sent is what changes.
        const current = await getNetwork(event, event.params.tenant, event.params.name);
        const patch: NetworkPatch = {
            ...(description !== (current.description ?? '') ? { description } : {}),
            ...(ipv4 !== (current.ipv4 ?? '') ? { ipv4 } : {}),
            ...(ipv6 !== (current.ipv6 ?? '') ? { ipv6 } : {})
        };
        if (Object.keys(patch).length === 0) return refuse('Nothing to change.');

        const result = await patchNetwork(event, event.params.tenant, event.params.name, patch);
        if (result.ok === false) return fail(result.status, { values, message: result.message });
        // The answer is 202: Incus applies the change a few seconds later, and the page follows the network meanwhile.
        return { saved: true, values: undefined, message: undefined };
    },

    // Delete the network. Nothing happens unless the exact name was typed. While an instance is attached the API refuses (409,
    // `in_use`) and its sentence names the instances: it is shown as it is, next to the form, and the person stays on the page.
    delete: async (event) => {
        const name = event.params.name;
        if (!isConfirmed(await event.request.formData(), name))
            return fail(400, { remove: { message: `The name you typed is not ${name}.` } });
        const result = await deleteNetwork(event, event.params.tenant, name);
        if (result.ok === false)
            return fail(result.status, { remove: { message: result.message } });
        // The network stays, `Deleting`, until it is gone: the list follows it.
        redirect(303, `/t/${event.params.tenant}/networks?deleted=${name}`);
    }
};
