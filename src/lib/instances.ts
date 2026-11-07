import { INSTANCE_NAME } from '../params/instance';

/** What the API accepts for an instance (`InstanceCreate` and `InstancePatch` of the OpenAPI document), shared by the forms and the actions. */
export { INSTANCE_NAME };

/** The same as a `pattern` attribute (the browser anchors it itself). */
export const INSTANCE_NAME_PATTERN = '[a-z]([a-z0-9\\-]{0,61}[a-z0-9])?';

export const LIMITS = {
    cpu: { min: 1, max: 16, default: 1 },
    memoryMiB: { min: 256, max: 65536, default: 1024 },
    diskGiB: { min: 1, max: 500, default: 10 }
} as const;

export type Resource = keyof typeof LIMITS;

export const MAX_SSH_KEYS = 20;

/** A line of authorized_keys as the API accepts it: a key type, the key in base64 and, at most, a comment of one word. */
export const SSH_KEY =
    /^(ssh-ed25519|ssh-rsa|ecdsa-sha2-nistp(256|384|521)|sk-ssh-ed25519@openssh\.com|sk-ecdsa-sha2-nistp256@openssh\.com) [A-Za-z0-9+/]{16,}={0,3}( [A-Za-z0-9@._+=/-]{1,100})?$/;

const MAX_SSH_KEY_LENGTH = 4096;

/** The keys typed one per line. Blank lines and the ends of the lines are ignored. */
export const parseKeys = (text: string) =>
    text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

/** What is wrong with the keys, in plain words, or undefined when they are fine. */
export function keysProblem(keys: string[]): string | undefined {
    if (keys.length > MAX_SSH_KEYS) return `At most ${MAX_SSH_KEYS} SSH keys.`;
    const bad = keys.findIndex((key) => key.length > MAX_SSH_KEY_LENGTH || !SSH_KEY.test(key));
    if (bad >= 0)
        return `Line ${bad + 1} is not an SSH public key: it is <type> <key>, like ssh-ed25519 AAAA…, with at most a one word comment of letters, digits and @._+=/-.`;
    if (new Set(keys).size !== keys.length) return 'The same key is given twice.';
    return undefined;
}

/**
 * A whole number of a form field within the limits of the API, or a sentence that says what is wrong. An empty field is `undefined`:
 * the API then uses its default.
 */
export function readNumber(
    form: FormData,
    field: Resource,
    label: string,
    unit: string
): { value: number | undefined } | { message: string } {
    const raw = String(form.get(field) ?? '').trim();
    if (raw === '') return { value: undefined };
    const { min, max } = LIMITS[field];
    const value = Number(raw);
    if (!Number.isInteger(value) || value < min || value > max)
        return { message: `${label} is a whole number from ${min} to ${max}${unit}.` };
    return { value };
}

/** What Incus reports and what the VM is doing, in one phrase: `Running`, `Stopped`, `Stopped, starting`. Empty until the VM exists. */
export const describeState = (instance: { state?: string; transition?: 'starting' | 'stopping' }) =>
    [instance.state, instance.transition].filter(Boolean).join(', ');

/** What a set of instances uses, in the units of a plan. Stopped machines count, as they do for the quota of the platform. */
export const usageOf = (instances: { cpu: number; memoryMiB: number; diskGiB: number }[]) => ({
    instances: instances.length,
    vcpu: instances.reduce((sum, i) => sum + i.cpu, 0),
    memoryGiB: instances.reduce((sum, i) => sum + i.memoryMiB, 0) / 1024,
    diskGiB: instances.reduce((sum, i) => sum + i.diskGiB, 0)
});

/** The ready-made sizes of the creation form. The details stay available for those who want them. */
export const SIZES = {
    light: { label: 'Light', cpu: 1, memoryMiB: 1024, diskGiB: 10 },
    standard: { label: 'Standard', cpu: 2, memoryMiB: 2048, diskGiB: 20 },
    heavy: { label: 'Heavy', cpu: 4, memoryMiB: 4096, diskGiB: 40 }
} as const;

export type SizeName = keyof typeof SIZES;
