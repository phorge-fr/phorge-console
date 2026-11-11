/** What the API accepts for a network (`NetworkCreate` of the OpenAPI document), shared by the form and its action. */

/** The name of a network in its tenant: 1 to 15 characters, the limit of Incus. */
export const NETWORK_NAME = /^[a-z]([a-z0-9-]{0,13}[a-z0-9])?$/;

/** The same as a `pattern` attribute (the browser anchors it itself). */
export const NETWORK_NAME_PATTERN = '[a-z]([a-z0-9\\-]{0,13}[a-z0-9])?';

export const MAX_NETWORK_NAME_LENGTH = 15;

export const MAX_NETWORK_DESCRIPTION_LENGTH = 200;

/** The name `new` is the creation page of the networks: a network of that name would not have a page of its own. */
export const RESERVED_NETWORK_NAME = 'new';

/**
 * The shape of an IPv6 range, `address/nn`: only what a person can mistype. Whether it is a /64 in fd00::/8, written as the
 * network address, and whether it is free is for the API to say.
 */
export function isIpv6Cidr(value: string) {
    const match = /^([0-9a-fA-F:]{2,39})\/(\d{1,3})$/.exec(value);
    if (!match) return false;
    const [, address, prefix] = match;
    return (
        Number(prefix) <= 128 &&
        address.includes(':') &&
        !address.includes(':::') &&
        (address.match(/::/g) ?? []).length <= 1 &&
        address.split(':').every((group) => group.length <= 4)
    );
}

export const IPV4_HELP =
    'A private range, from /16 to /29, written as its network address, like 10.77.1.0/24.';

export const IPV6_HELP =
    'A local range: a /64 in fd00::/8, written as its network address, like fd42:1:2:3::/64.';

/**
 * The shape of an IPv4 range, `a.b.c.d/nn`: only what a person can mistype. Whether it is private, whether its prefix is
 * between /16 and /29, whether it is a network address and whether it is free is for the API to say.
 */
export function isIpv4Cidr(value: string) {
    const match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\/(\d{1,2})$/.exec(value);
    if (!match) return false;
    const [a, b, c, d, prefix] = match.slice(1).map(Number);
    return [a, b, c, d].every((part) => part <= 255) && prefix <= 32;
}

/** The most networks an instance is attached to (`maxItems` of `networks` in the OpenAPI document). */
export const MAX_INSTANCE_NETWORKS = 8;

/** What is wrong with the networks chosen for an instance, in plain words, or undefined. A comfort: the API checks it again. */
export function networksProblem(names: string[]): string | undefined {
    if (names.length === 0) return 'Choose at least one network.';
    if (names.length > MAX_INSTANCE_NETWORKS)
        return `An instance is attached to ${MAX_INSTANCE_NETWORKS} networks at most.`;
    if (names.some((name) => !NETWORK_NAME.test(name))) return 'Choose a network from the list.';
    if (new Set(names).size !== names.length) return 'The same network is chosen twice.';
    return undefined;
}

/** A network as something to pick by search: its name, and its range and description to tell networks apart. */
export const networkChoice = (network: { name: string; ipv4?: string; description?: string }) => ({
    name: network.name,
    hint: [network.ipv4, network.description].filter(Boolean).join(' · ') || undefined
});
