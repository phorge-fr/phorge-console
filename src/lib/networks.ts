/** What the API accepts for a network (`NetworkCreate` of the OpenAPI document), shared by the form and its action. */

/** The name of a network in its tenant: 1 to 15 characters, the limit of Incus. */
export const NETWORK_NAME = /^[a-z]([a-z0-9-]{0,13}[a-z0-9])?$/;

/** The same as a `pattern` attribute (the browser anchors it itself). */
export const NETWORK_NAME_PATTERN = '[a-z]([a-z0-9\\-]{0,13}[a-z0-9])?';

export const MAX_NETWORK_NAME_LENGTH = 15;

export const MAX_NETWORK_DESCRIPTION_LENGTH = 200;
