import { fail, isRedirect, redirect } from '@sveltejs/kit';
import { INSTANCE_NAME, keysProblem, parseKeys, readNumber } from '#lib/instances';
import { NETWORK_NAME } from '#lib/networks';
import { listImages } from '#lib/server/images';
import { listNetworks } from '#lib/server/networks';
import { getQuota } from '#lib/server/quota';
import { createInstance, type InstanceCreate } from '#lib/server/instances';
import type { Actions, PageServerLoad } from './$types';

// What the form needs: the images and the networks that are `Ready` (the API refuses any other) and the quota, to say what is left in
// the plan. A tenant has no network until its people create one. The quota only informs: the form works without it, and the API
// refuses a request past a limit (`409`, `quota_exceeded`) with a message that says which.
export const load: PageServerLoad = async (event) => {
    const [quota, images, networks] = await Promise.all([
        getQuota(event, event.params.tenant).catch((error) => {
            if (isRedirect(error)) throw error;
            return undefined;
        }),
        listImages(event, event.params.tenant),
        listNetworks(event, event.params.tenant)
    ]);
    return {
        quota,
        images: images.filter((image) => image.phase === 'Ready'),
        networks: networks.filter((network) => network.phase === 'Ready'),
        // The networks that exist but are not ready yet: the form says to wait instead of asking to create one.
        networksPending: networks.some(
            (network) => network.phase === 'Provisioning' || network.phase === 'Failed'
        )
    };
};

export const actions: Actions = {
    // Create a virtual machine from an image of the tenant. What is not given is the default of the API.
    default: async (event) => {
        const form = await event.request.formData();
        const name = String(form.get('name') ?? '').trim();
        const image = String(form.get('image') ?? '').trim();
        const network = String(form.get('network') ?? '').trim();
        const keysText = String(form.get('sshPublicKeys') ?? '');
        const values = {
            name,
            image,
            network,
            cpu: String(form.get('cpu') ?? ''),
            memoryMiB: String(form.get('memoryMiB') ?? ''),
            diskGiB: String(form.get('diskGiB') ?? ''),
            running: form.get('running') === 'on',
            nesting: form.get('nesting') === 'on',
            secureBoot: form.get('secureBoot') === 'on',
            sshPublicKeys: keysText
        };
        const refuse = (message: string) => fail(400, { values, message });

        // What the person can fix is said here, in their words; the API checks it all again.
        if (!INSTANCE_NAME.test(name))
            return refuse(
                'The name has lowercase letters, digits and hyphens, starts with a letter and ends with a letter or a digit.'
            );
        // The creation page is at `instances/new`: an instance of that name would not have a page of its own.
        if (name === 'new')
            return refuse('The name new is reserved by the console. Choose another one.');
        if (!image) return refuse('Choose an image.');
        if (!NETWORK_NAME.test(network)) return refuse('Choose a network.');
        // Empty fields mean the defaults of the API.
        const cpu = readNumber(form, 'cpu', 'The number of vCPU', '');
        if ('message' in cpu) return refuse(cpu.message);
        const memory = readNumber(form, 'memoryMiB', 'The memory', ' MiB');
        if ('message' in memory) return refuse(memory.message);
        const disk = readNumber(form, 'diskGiB', 'The disk', ' GiB');
        if ('message' in disk) return refuse(disk.message);
        const keys = parseKeys(keysText);
        const problem = keysProblem(keys);
        if (problem) return refuse(problem);

        const instance: InstanceCreate = {
            name,
            image,
            network,
            running: values.running,
            nesting: values.nesting,
            secureBoot: values.secureBoot,
            ...(cpu.value ? { cpu: cpu.value } : {}),
            ...(memory.value ? { memoryMiB: memory.value } : {}),
            ...(disk.value ? { diskGiB: disk.value } : {}),
            ...(keys.length ? { sshPublicKeys: keys } : {})
        };
        const result = await createInstance(event, event.params.tenant, instance);
        if (result.ok === false) return fail(result.status, { values, message: result.message });
        // The instance exists and is being made: its page follows it.
        redirect(303, `/t/${event.params.tenant}/instances/${name}`);
    }
};
