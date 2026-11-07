import { fail, redirect } from '@sveltejs/kit';
import { INSTANCE_NAME, keysProblem, parseKeys, readNumber, SIZES } from '#lib/instances';
import { listImages } from '#lib/server/images';
import { createInstance, listInstances, type InstanceCreate } from '#lib/server/instances';
import type { Actions, PageServerLoad } from './$types';

// Anybody with a role on the tenant reads the instances; changing them is for users, operators and administrators, which the API decides.
export const load: PageServerLoad = async (event) => {
    const [instances, images] = await Promise.all([
        listInstances(event, event.params.tenant),
        listImages(event, event.params.tenant)
    ]);
    // An instance starts from an image that is `Ready`: the API refuses any other.
    return { instances, images: images.filter((image) => image.phase === 'Ready') };
};

export const actions: Actions = {
    // Create a virtual machine from an image of the tenant. What is not given is the default of the API.
    create: async (event) => {
        const form = await event.request.formData();
        const name = String(form.get('name') ?? '').trim();
        const image = String(form.get('image') ?? '').trim();
        const keysText = String(form.get('sshPublicKeys') ?? '');
        const size = String(form.get('size') ?? 'standard');
        const values = {
            name,
            image,
            size,
            cpu: String(form.get('cpu') ?? ''),
            memoryMiB: String(form.get('memoryMiB') ?? ''),
            diskGiB: String(form.get('diskGiB') ?? ''),
            running: form.get('running') === 'on',
            nesting: form.get('nesting') === 'on',
            secureBoot: form.get('secureBoot') === 'on',
            sshPublicKeys: keysText
        };
        const refuse = (message: string) => fail(400, { create: { values, message } });

        // What the person can fix is said here, in their words; the API checks it all again.
        if (!INSTANCE_NAME.test(name))
            return refuse(
                'The name has lowercase letters, digits and hyphens, starts with a letter and ends with a letter or a digit.'
            );
        if (!image) return refuse('Choose an image.');
        // A ready-made size, or the details typed by the person: empty details mean the defaults of the API.
        const preset = size in SIZES ? SIZES[size as keyof typeof SIZES] : undefined;
        const cpu = preset
            ? { value: preset.cpu }
            : readNumber(form, 'cpu', 'The number of vCPU', '');
        if ('message' in cpu) return refuse(cpu.message);
        const memory = preset
            ? { value: preset.memoryMiB }
            : readNumber(form, 'memoryMiB', 'The memory', ' MiB');
        if ('message' in memory) return refuse(memory.message);
        const disk = preset
            ? { value: preset.diskGiB }
            : readNumber(form, 'diskGiB', 'The disk', ' GiB');
        if ('message' in disk) return refuse(disk.message);
        const keys = parseKeys(keysText);
        const problem = keysProblem(keys);
        if (problem) return refuse(problem);

        const instance: InstanceCreate = {
            name,
            image,
            running: values.running,
            nesting: values.nesting,
            secureBoot: values.secureBoot,
            ...(cpu.value ? { cpu: cpu.value } : {}),
            ...(memory.value ? { memoryMiB: memory.value } : {}),
            ...(disk.value ? { diskGiB: disk.value } : {}),
            ...(keys.length ? { sshPublicKeys: keys } : {})
        };
        const result = await createInstance(event, event.params.tenant, instance);
        if (result.ok === false)
            return fail(result.status, { create: { values, message: result.message } });
        // The instance exists and is being made: its page follows it.
        redirect(303, `/t/${event.params.tenant}/instances/${name}`);
    }
};
