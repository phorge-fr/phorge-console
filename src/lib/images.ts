/** What the API accepts for an image (`ImageCreate` of the OpenAPI document). Kept here, without any server import, so that a form can use it too. */

/** The name of the image in its tenant: it is what an instance starts from. */
export const IMAGE_NAME = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;

/** The same as a `pattern` attribute (the browser anchors it itself). */
export const IMAGE_NAME_PATTERN = '[a-z0-9]([a-z0-9\\-]{0,61}[a-z0-9])?';

export const IMAGE_ALIAS = /^[a-z0-9][a-z0-9._-]{0,62}$/;

export const MAX_ALIASES = 10;

/** The only image server the platform allows, linuxcontainers.org. It is the default of the API, so the console never sends it. */
export const IMAGE_SERVER = 'images';
