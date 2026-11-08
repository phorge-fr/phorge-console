import { fail, redirect } from '@sveltejs/kit';
import { readNumber } from '#lib/instances';
import {
    MAX_PROFILE_DESCRIPTION_LENGTH,
    PROFILE_NAME,
    RESERVED_PROFILE_NAMES
} from '#lib/profiles';
import { createProfile } from '#lib/server/profiles';
import type { Actions } from './$types';

// The form is the page: making a profile is for operators and administrators of the tenant, which the API decides.
export const actions: Actions = {
    default: async (event) => {
        const form = await event.request.formData();
        const name = String(form.get('name') ?? '').trim();
        const description = String(form.get('description') ?? '').trim();
        const values = {
            name,
            description,
            cpu: String(form.get('cpu') ?? ''),
            memoryMiB: String(form.get('memoryMiB') ?? ''),
            diskGiB: String(form.get('diskGiB') ?? '')
        };
        const refuse = (message: string) => fail(400, { values, message });

        // What the person can fix is said here, in their words; the API checks it all again.
        if (!PROFILE_NAME.test(name))
            return refuse(
                'The name has 1 to 32 characters: lowercase letters, digits and hyphens, starting with a letter and not ending with a hyphen.'
            );
        if (RESERVED_PROFILE_NAMES.includes(name))
            return refuse(`The name ${name} is taken: every tenant has s, m and l.`);
        if (description.length > MAX_PROFILE_DESCRIPTION_LENGTH)
            return refuse(
                `The description has ${MAX_PROFILE_DESCRIPTION_LENGTH} characters at most.`
            );
        // The three values are all needed: a profile is a size, not a change.
        const cpu = readNumber(form, 'cpu', 'The number of vCPU', '');
        if ('message' in cpu) return refuse(cpu.message);
        const memory = readNumber(form, 'memoryMiB', 'The memory', ' MiB');
        if ('message' in memory) return refuse(memory.message);
        const disk = readNumber(form, 'diskGiB', 'The disk', ' GiB');
        if ('message' in disk) return refuse(disk.message);
        if (!cpu.value || !memory.value || !disk.value)
            return refuse('Give the vCPU, the memory and the disk: a profile has all three.');

        const result = await createProfile(event, event.params.tenant, {
            name,
            ...(description ? { description } : {}),
            cpu: cpu.value,
            memoryMiB: memory.value,
            diskGiB: disk.value
        });
        if (result.ok === false) return fail(result.status, { values, message: result.message });
        // The profile exists and is being made: the list follows it until it is ready.
        redirect(303, `/t/${event.params.tenant}/profiles`);
    }
};
