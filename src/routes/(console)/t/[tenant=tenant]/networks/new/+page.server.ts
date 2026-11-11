import { fail, redirect } from '@sveltejs/kit';
import {
    isIpv4Cidr,
    isIpv6Cidr,
    MAX_NETWORK_DESCRIPTION_LENGTH,
    NETWORK_NAME,
    RESERVED_NETWORK_NAME
} from '#lib/networks';
import { createNetwork } from '#lib/server/networks';
import type { Actions } from './$types';

// The form is the page: creating a network is for operators and administrators of the tenant, which the API decides.
export const actions: Actions = {
    default: async (event) => {
        const form = await event.request.formData();
        const name = String(form.get('name') ?? '').trim();
        const description = String(form.get('description') ?? '').trim();
        const ipv4 = String(form.get('ipv4') ?? '').trim();
        const ipv6 = String(form.get('ipv6') ?? '').trim();
        const values = { name, description, ipv4, ipv6 };
        const refuse = (message: string) => fail(400, { values, message });

        // What the person can fix is said here, in their words; the API checks it all again.
        if (!NETWORK_NAME.test(name))
            return refuse(
                'The name has 1 to 15 characters: lowercase letters, digits and hyphens, starting with a letter and not ending with a hyphen.'
            );
        // The creation page is at `networks/new`: a network of that name would not have a page of its own.
        if (name === RESERVED_NETWORK_NAME)
            return refuse('The name new is reserved by the console. Choose another one.');
        if (description.length > MAX_NETWORK_DESCRIPTION_LENGTH)
            return refuse(
                `The description has ${MAX_NETWORK_DESCRIPTION_LENGTH} characters at most.`
            );

        if (ipv4 && !isIpv4Cidr(ipv4))
            return refuse(
                'The range is written like 10.77.1.0/24: four numbers, a slash and the length of the prefix. Leave it empty to let the platform choose.'
            );

        if (ipv6 && !isIpv6Cidr(ipv6))
            return refuse(
                'The IPv6 range is written like fd42:1:2:3::/64: an address, a slash and the length of the prefix. Leave it empty to let the platform choose.'
            );

        const result = await createNetwork(event, event.params.tenant, {
            name,
            ...(description ? { description } : {}),
            ...(ipv4 ? { ipv4 } : {}),
            ...(ipv6 ? { ipv6 } : {})
        });
        if (result.ok === false) return fail(result.status, { values, message: result.message });
        // The network exists and is being deployed: the list follows it until it is ready.
        redirect(303, `/t/${event.params.tenant}/networks`);
    }
};
