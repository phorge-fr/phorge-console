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

/**
 * What a profile says about secure boot, as a plain form sends it. A select cannot send "nothing" except by an empty value:
 * `''` is "the profile does not say" (the field is left out of the request), `on` is `true` and `off` is `false`.
 */
export type SecureBootChoice = '' | 'on' | 'off';

const secureBootChoices = (notSet: string): { value: SecureBootChoice; label: string }[] => [
    { value: '', label: notSet },
    { value: 'on', label: 'On' },
    { value: 'off', label: 'Off' }
];

/** The choices of the form of a profile. */
export const SECURE_BOOT_CHOICES = secureBootChoices("Not set: the instance's default");

/**
 * The choices of the form of an instance, which sends the same three. Left alone, the instance takes the secure boot of its profile
 * when it has a profile that says one, else the default of the platform, which is on.
 */
export const INSTANCE_SECURE_BOOT_CHOICES = secureBootChoices("Not set: the profile's, or on");

/** The choice of the form as the API takes it: `undefined` (not sent), `true` or `false`. Anything else is not a choice. */
export const readSecureBoot = (
    raw: string
): { value: boolean | undefined } | { message: string } => {
    if (raw === '') return { value: undefined };
    if (raw === 'on') return { value: true };
    if (raw === 'off') return { value: false };
    return { message: 'Choose on, off or not set for the secure boot.' };
};

/** What a profile says about secure boot, in words. An absent value is not `false`: the profile does not say. */
export const describeSecureBoot = (secureBoot: boolean | undefined) =>
    secureBoot === undefined ? "Not set: the instance's default" : secureBoot ? 'On' : 'Off';
