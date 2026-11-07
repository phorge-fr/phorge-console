import { fail, redirect } from '@sveltejs/kit';
import { keysProblem, parseKeys, readNumber } from '#lib/instances';
import { isConfirmed } from '#lib/server/confirm';
import { deleteInstance, getInstance, patchInstance } from '#lib/server/instances';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => ({
    instance: await getInstance(event, event.params.tenant, event.params.name)
});

export const actions: Actions = {
    // Start or stop the same virtual machine. A VM started a moment ago cannot be stopped yet: the API says how long to wait.
    power: async (event) => {
        const running = (await event.request.formData()).get('running') === 'true';
        const result = await patchInstance(event, event.params.tenant, event.params.name, {
            running
        });
        if (result.ok === false) return fail(result.status, { power: { message: result.message } });
        return { power: { message: undefined } };
    },

    // Change the CPU, the memory and the disk, applied live. The image, nesting and secure boot cannot change.
    resize: async (event) => {
        const form = await event.request.formData();
        const cpu = readNumber(form, 'cpu', 'The number of vCPU', '');
        if ('message' in cpu) return fail(400, { resize: { saved: false, message: cpu.message } });
        const memory = readNumber(form, 'memoryMiB', 'The memory', ' MiB');
        if ('message' in memory)
            return fail(400, { resize: { saved: false, message: memory.message } });
        const disk = readNumber(form, 'diskGiB', 'The disk', ' GiB');
        if ('message' in disk)
            return fail(400, { resize: { saved: false, message: disk.message } });
        const patch = {
            ...(cpu.value ? { cpu: cpu.value } : {}),
            ...(memory.value ? { memoryMiB: memory.value } : {}),
            ...(disk.value ? { diskGiB: disk.value } : {})
        };
        if (Object.keys(patch).length === 0)
            return fail(400, { resize: { saved: false, message: 'Give a value to change.' } });
        const result = await patchInstance(event, event.params.tenant, event.params.name, patch);
        if (result.ok === false)
            return fail(result.status, { resize: { saved: false, message: result.message } });
        return { resize: { saved: true, message: undefined } };
    },

    // Replace the SSH keys of the VM, one per line. An empty field removes them all.
    keys: async (event) => {
        const text = String((await event.request.formData()).get('sshPublicKeys') ?? '');
        const keys = parseKeys(text);
        const problem = keysProblem(keys);
        if (problem) return fail(400, { keys: { saved: false, text, message: problem } });
        const result = await patchInstance(event, event.params.tenant, event.params.name, {
            sshPublicKeys: keys
        });
        if (result.ok === false)
            return fail(result.status, { keys: { saved: false, text, message: result.message } });
        return { keys: { saved: true, text, message: undefined } };
    },

    // Destroy the VM and its disk. Nothing happens unless the exact name was typed.
    delete: async (event) => {
        const name = event.params.name;
        if (!isConfirmed(await event.request.formData(), name))
            return fail(400, { remove: { message: `The name you typed is not ${name}.` } });
        const result = await deleteInstance(event, event.params.tenant, name);
        if (result.ok === false)
            return fail(result.status, { remove: { message: result.message } });
        // The instance stays, `Deleting`, until it is gone: the list follows it.
        redirect(303, `/t/${event.params.tenant}/instances`);
    }
};
