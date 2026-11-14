import { fail, isRedirect, redirect } from '@sveltejs/kit';
import { keysProblem, parseKeys, readNumber } from '#lib/instances';
import {
    BUILTIN_PROFILE_NAMES,
    MAX_PROFILE_DESCRIPTION_LENGTH,
    readSecureBoot
} from '#lib/profiles';
import { isConfirmed } from '#lib/server/confirm';
import { listInstances } from '#lib/server/instances';
import { deleteProfile, getProfile, patchProfile, type ProfilePatch } from '#lib/server/profiles';
import { labelKey } from '#lib/server/sshkeys';
import type { Actions, PageServerLoad } from './$types';

// Anybody with a role on the tenant reads the profile; deleting it is for operators and administrators, which the API decides.
export const load: PageServerLoad = async (event) => {
    const [profile, instances] = await Promise.all([
        getProfile(event, event.params.tenant, event.params.name),
        // The virtual machines that have it. Without the list the page still shows the profile and says so.
        listInstances(event, event.params.tenant).catch((error) => {
            if (isRedirect(error)) throw error;
            return undefined;
        })
    ]);
    return {
        profile,
        // The keys the profile gives, as a person recognises them: the type, the fingerprint and the comment.
        keys: (profile.sshPublicKeys ?? []).map(labelKey),
        instances: instances?.filter((instance) => instance.profile === profile.name)
    };
};

export const actions: Actions = {
    // Change the size, the description, the secure boot and the SSH keys. Only what differs from the profile is sent: what is absent
    // stays. The API refuses what Incus cannot do in place (409): a smaller disk while an instance has the profile, less memory while
    // one that has it runs, a size over the limits of the tenant. Its sentence says what to do and is shown as it is; the console never
    // stops an instance to make the change possible.
    save: async (event) => {
        const name = event.params.name;
        if (BUILTIN_PROFILE_NAMES.includes(name))
            return fail(403, {
                message: `${name} is one of the three profiles every tenant has: it cannot be changed.`
            });
        const form = await event.request.formData();
        const description = String(form.get('description') ?? '').trim();
        const values = {
            description,
            cpu: String(form.get('cpu') ?? ''),
            memoryMiB: String(form.get('memoryMiB') ?? ''),
            diskGiB: String(form.get('diskGiB') ?? ''),
            secureBoot: String(form.get('secureBoot') ?? ''),
            sshPublicKeys: String(form.get('sshPublicKeys') ?? '')
        };
        const refuse = (message: string, status = 400) => fail(status, { values, message });

        // What the person can fix is said here, in their words; the API checks it all again.
        if (description.length > MAX_PROFILE_DESCRIPTION_LENGTH)
            return refuse(
                `The description has ${MAX_PROFILE_DESCRIPTION_LENGTH} characters at most.`
            );
        const cpu = readNumber(form, 'cpu', 'The number of vCPU', '');
        if ('message' in cpu) return refuse(cpu.message);
        const memory = readNumber(form, 'memoryMiB', 'The memory', ' MiB');
        if ('message' in memory) return refuse(memory.message);
        const disk = readNumber(form, 'diskGiB', 'The disk', ' GiB');
        if ('message' in disk) return refuse(disk.message);
        const secureBoot = readSecureBoot(values.secureBoot);
        if ('message' in secureBoot) return refuse(secureBoot.message);
        const keys = parseKeys(values.sshPublicKeys);
        const problem = keysProblem(keys);
        if (problem) return refuse(problem);

        // The profile as the API has it now, so that what is sent is what changes. An emptied size field leaves the size alone.
        const current = await getProfile(event, event.params.tenant, name);
        const currentKeys = current.sshPublicKeys ?? [];
        const patch: ProfilePatch = {
            ...(description !== (current.description ?? '') ? { description } : {}),
            ...(cpu.value !== undefined && cpu.value !== current.cpu ? { cpu: cpu.value } : {}),
            ...(memory.value !== undefined && memory.value !== current.memoryMiB
                ? { memoryMiB: memory.value }
                : {}),
            ...(disk.value !== undefined && disk.value !== current.diskGiB
                ? { diskGiB: disk.value }
                : {}),
            // Not set is `null`: it removes a setting the profile had.
            ...(secureBoot.value !== current.secureBoot
                ? { secureBoot: secureBoot.value ?? null }
                : {}),
            ...(keys.length !== currentKeys.length || keys.some((key, i) => key !== currentKeys[i])
                ? { sshPublicKeys: keys }
                : {})
        };
        if (Object.keys(patch).length === 0) return refuse('Nothing to change.');

        const result = await patchProfile(event, event.params.tenant, name, patch);
        if (result.ok === false) return fail(result.status, { values, message: result.message });
        return { saved: true, values: undefined, message: undefined };
    },

    // Delete a profile a user made. Nothing happens unless the exact name was typed. The API refuses (409, `in_use`) while an
    // instance has the profile and names the instances: its sentence is shown as it is.
    delete: async (event) => {
        const name = event.params.name;
        if (BUILTIN_PROFILE_NAMES.includes(name))
            return fail(403, {
                remove: {
                    message: `${name} is one of the three profiles every tenant has: it cannot be deleted.`
                }
            });
        if (!isConfirmed(await event.request.formData(), name))
            return fail(400, { remove: { message: `The name you typed is not ${name}.` } });
        const result = await deleteProfile(event, event.params.tenant, name);
        if (result.ok === false)
            return fail(result.status, { remove: { message: result.message } });
        // The profile stays, `Deleting`, until it is gone: the list follows it and says what became of it.
        redirect(303, `/t/${event.params.tenant}/profiles?deleted=${name}`);
    }
};
