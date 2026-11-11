import { fail, isRedirect, redirect } from '@sveltejs/kit';
import { INSTANCE_NAME, keysProblem, parseKeys, readNumber } from '#lib/instances';
import { networksProblem } from '#lib/networks';
import { PROFILE_NAME } from '#lib/profiles';
import { listImages } from '#lib/server/images';
import { listNetworks } from '#lib/server/networks';
import { listProfiles } from '#lib/server/profiles';
import { getQuota } from '#lib/server/quota';
import { createInstance, type InstanceCreate } from '#lib/server/instances';
import type { Actions, PageServerLoad } from './$types';

// What the form needs: the images and the networks that are `Ready` (the API refuses any other) and the quota, to say what is left in
// the tenant. A tenant has no network until its people create one. The quota only informs: the form works without it, and the API
// refuses a request past a limit (`409`, `quota_exceeded`) with a message that says which.
export const load: PageServerLoad = async (event) => {
    const [quota, images, networks, profiles] = await Promise.all([
        getQuota(event, event.params.tenant).catch((error) => {
            if (isRedirect(error)) throw error;
            return undefined;
        }),
        listImages(event, event.params.tenant),
        listNetworks(event, event.params.tenant),
        // The sizes to choose from. Without them the form still offers a custom size.
        listProfiles(event, event.params.tenant).catch((error) => {
            if (isRedirect(error)) throw error;
            return [];
        })
    ]);
    return {
        quota,
        profiles,
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
        // One NIC each, in the order of the list of the form: the first is `eth0`.
        const networks = form.getAll('networks').map((value) => String(value).trim());
        const keysText = String(form.get('sshPublicKeys') ?? '');
        const values = {
            name,
            image,
            networks,
            size: String(form.get('size') ?? 'custom'),
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
        const networksIssue = networksProblem(networks);
        if (networksIssue) return refuse(networksIssue);
        // The size is a profile of the tenant or a custom size, never both. A custom size with empty fields takes the defaults of the API.
        const custom = values.size === 'custom';
        if (!custom && !PROFILE_NAME.test(values.size)) return refuse('Choose a size.');
        const cpu = readNumber(form, 'cpu', 'The number of vCPU', '');
        if (custom && 'message' in cpu) return refuse(cpu.message);
        const memory = readNumber(form, 'memoryMiB', 'The memory', ' MiB');
        if (custom && 'message' in memory) return refuse(memory.message);
        const disk = readNumber(form, 'diskGiB', 'The disk', ' GiB');
        if (custom && 'message' in disk) return refuse(disk.message);
        const keys = parseKeys(keysText);
        const problem = keysProblem(keys);
        if (problem) return refuse(problem);

        const instance: InstanceCreate = {
            name,
            image,
            networks,
            running: values.running,
            nesting: values.nesting,
            secureBoot: values.secureBoot,
            ...(custom
                ? {
                      ...('value' in cpu && cpu.value ? { cpu: cpu.value } : {}),
                      ...('value' in memory && memory.value ? { memoryMiB: memory.value } : {}),
                      ...('value' in disk && disk.value ? { diskGiB: disk.value } : {})
                  }
                : { profile: values.size }),
            ...(keys.length ? { sshPublicKeys: keys } : {})
        };
        const result = await createInstance(event, event.params.tenant, instance);
        if (result.ok === false) return fail(result.status, { values, message: result.message });
        // The instance exists and is being made: its page follows it.
        redirect(303, `/t/${event.params.tenant}/instances/${name}`);
    }
};
