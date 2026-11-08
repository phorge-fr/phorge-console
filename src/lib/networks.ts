/** What the API accepts for a network (`NetworkCreate` of the OpenAPI document), shared by the form and its action. */

/** The name of a network in its tenant: 1 to 15 characters, the limit of Incus. */
export const NETWORK_NAME = /^[a-z]([a-z0-9-]{0,13}[a-z0-9])?$/;

/** The same as a `pattern` attribute (the browser anchors it itself). */
export const NETWORK_NAME_PATTERN = '[a-z]([a-z0-9\\-]{0,13}[a-z0-9])?';

export const MAX_NETWORK_NAME_LENGTH = 15;

export const MAX_NETWORK_DESCRIPTION_LENGTH = 200;

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
