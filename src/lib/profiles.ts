/** What the API accepts for a profile (`ProfileCreate` of the OpenAPI document), shared by the form and its action. */

/** The name of a profile in its tenant: 1 to 32 characters. `s`, `m`, `l` and `default` are taken. */
export { PROFILE_NAME } from '../params/profile';

/** The same as a `pattern` attribute (the browser anchors it itself). */
export const PROFILE_NAME_PATTERN = '[a-z]([a-z0-9\\-]{0,30}[a-z0-9])?';

export const MAX_PROFILE_NAME_LENGTH = 32;

export const MAX_PROFILE_DESCRIPTION_LENGTH = 200;

/** The names the platform keeps: the three profiles every tenant has, and `default`. */
export const RESERVED_PROFILE_NAMES = ['s', 'm', 'l', 'default'];

/** The three profiles every tenant has: the API does not change or delete them (`403`). */
export const BUILTIN_PROFILE_NAMES = ['s', 'm', 'l'];

/** A size in words, as the lists and the forms show it: "2 vCPU · 4 GiB of memory · 128 GiB of disk". */
export const describeSize = (size: { cpu: number; memoryMiB: number; diskGiB: number }) =>
    `${size.cpu} vCPU · ${Math.round((size.memoryMiB / 1024) * 10) / 10} GiB of memory · ${size.diskGiB} GiB of disk`;
