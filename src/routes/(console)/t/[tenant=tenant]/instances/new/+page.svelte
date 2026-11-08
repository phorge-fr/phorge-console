<script lang="ts">
    import Alert from '#lib/components/Alert.svelte';
    import PageHeader from '#lib/components/PageHeader.svelte';
    import ResourceFields from '#lib/components/ResourceFields.svelte';
    import { INSTANCE_NAME_PATTERN, MAX_SSH_KEYS, usageOf } from '#lib/instances';
    import { PLANS } from '#lib/plans';

    let { data, form } = $props();

    const id = $props.id();
    const list = $derived(`/t/${data.tenant.name}/instances`);
    const plan = $derived(PLANS[data.tenant.plan]);
    const values = $derived(form?.values);
    const usage = $derived(usageOf(data.instances));
    // What the plan still has room for, said under the size so that the person knows what fits.
    const left = $derived({
        instances: plan.instances - usage.instances,
        vcpu: plan.vcpu - usage.vcpu,
        memoryGiB: plan.memoryGiB - usage.memoryGiB,
        diskGiB: plan.diskGiB - usage.diskGiB
    });
    const full = $derived(left.instances <= 0);
</script>

<svelte:head>
    <title
        >Create an instance · {data.tenant.displayName || data.tenant.name} · Phorge console</title
    >
</svelte:head>

<main class="mx-auto w-full max-w-5xl px-4 py-8 md:px-10">
    <PageHeader
        title="Create an instance"
        subtitle="A virtual machine that starts from one of the images of this tenant."
        back={{ href: list, label: 'Instances' }}
    />

    {#if data.images.length === 0 || data.networks.length === 0}
        <div class="flex max-w-xl flex-col gap-4">
            {#if data.images.length === 0}
                <Alert tone="info" title="You need an image first">
                    A virtual machine starts from an image that is ready, and this tenant has none.
                    <a href="/t/{data.tenant.name}/images/new">Pull an image</a>, then come back.
                </Alert>
            {/if}
            {#if data.networks.length === 0}
                {#if data.networksPending}
                    <Alert tone="info" title="Your network is not ready yet">
                        A virtual machine is attached to a network that is ready. See
                        <a href="/t/{data.tenant.name}/networks">the networks</a>: it takes a few
                        seconds.
                    </Alert>
                {:else}
                    <Alert tone="info" title="You need a network first">
                        A virtual machine is attached to a network, and this tenant has none.
                        <a href="/t/{data.tenant.name}/networks/new">Create a network</a>, then come
                        back.
                    </Alert>
                {/if}
            {/if}
        </div>
    {:else}
        {#if full}
            <div class="mb-5 max-w-xl">
                <Alert tone="warning" title="The plan has no room left">
                    The plan {data.tenant.plan} allows {plan.instances}
                    {plan.instances === 1 ? 'virtual machine' : 'virtual machines'}, and this tenant
                    has {usage.instances}. Delete one to create another.
                </Alert>
            </div>
        {/if}
        {#if form?.message}
            <div class="mb-5 max-w-xl">
                <Alert tone="danger">{form.message}</Alert>
            </div>
        {/if}

        <form method="POST" class="flex max-w-xl flex-col gap-6">
            <div class="flex flex-col gap-1.5">
                <label for="{id}-name" class="field-label">Name</label>
                <input
                    id="{id}-name"
                    name="name"
                    required
                    maxlength="63"
                    pattern={INSTANCE_NAME_PATTERN}
                    value={values?.name ?? ''}
                    autocomplete="off"
                    autocapitalize="off"
                    spellcheck="false"
                    placeholder="web"
                    class="field max-w-sm font-mono"
                    aria-describedby="{id}-name-help"
                />
                <p id="{id}-name-help" class="help">
                    Lowercase letters, digits and hyphens, starting with a letter. It cannot change.
                </p>
            </div>

            <div class="flex flex-col gap-1.5">
                <label for="{id}-image" class="field-label">Image</label>
                <select
                    id="{id}-image"
                    name="image"
                    required
                    class="field max-w-sm font-mono"
                    aria-describedby="{id}-image-help"
                >
                    {#each data.images as image (image.name)}
                        <option value={image.name} selected={values?.image === image.name}>
                            {image.name} ({image.source.name})
                        </option>
                    {/each}
                </select>
                <p id="{id}-image-help" class="help">
                    Only the images that are ready. It cannot change.
                </p>
            </div>

            <div class="flex flex-col gap-1.5">
                <label for="{id}-network" class="field-label">Network</label>
                <select
                    id="{id}-network"
                    name="network"
                    required
                    class="field max-w-sm font-mono"
                    aria-describedby="{id}-network-help"
                >
                    {#each data.networks as network (network.name)}
                        <option value={network.name} selected={values?.network === network.name}>
                            {network.name}
                        </option>
                    {/each}
                </select>
                <p id="{id}-network-help" class="help">
                    Only the networks that are ready. It cannot change. <a
                        href="/t/{data.tenant.name}/networks/new">Create another</a
                    >.
                </p>
            </div>

            <fieldset class="m-0 flex min-w-0 flex-col gap-3 border-0 p-0">
                <legend class="field-label mb-2 p-0">Size</legend>
                <ResourceFields
                    values={{
                        cpu: values?.cpu ?? '',
                        memoryMiB: values?.memoryMiB ?? '',
                        diskGiB: values?.diskGiB ?? ''
                    }}
                    hint="An empty field takes the default: 1 vCPU, 1024 MiB, 10 GiB."
                />
                <p class="help tnum">
                    Left in the plan: {Math.max(left.instances, 0)}
                    {left.instances === 1 ? 'VM' : 'VMs'}, {Math.max(left.vcpu, 0)} vCPU, {Math.max(
                        Math.round(left.memoryGiB * 10) / 10,
                        0
                    )} GiB of memory, {Math.max(left.diskGiB, 0)} GiB of disk.
                </p>
            </fieldset>

            <div class="flex flex-col gap-1.5">
                <label for="{id}-keys" class="field-label">
                    SSH public keys <span class="font-normal text-fg-3">(optional)</span>
                </label>
                <textarea
                    id="{id}-keys"
                    name="sshPublicKeys"
                    rows="3"
                    autocomplete="off"
                    spellcheck="false"
                    placeholder="ssh-ed25519 AAAA… you@laptop"
                    class="field h-auto min-h-20 py-2 font-mono text-sm"
                    aria-describedby="{id}-keys-help">{values?.sshPublicKeys ?? ''}</textarea
                >
                <p id="{id}-keys-help" class="help">
                    One per line, {MAX_SSH_KEYS} at most. They are put in the machine when it starts,
                    so the image must be a <code class="font-mono">cloud</code> variant.
                </p>
            </div>

            <details>
                <summary class="cursor-pointer text-sm font-semibold text-fg-2">
                    Advanced options
                </summary>
                <div class="mt-3 flex flex-col gap-3">
                    <label class="flex items-start gap-3">
                        <input
                            type="checkbox"
                            name="running"
                            checked={values?.running ?? true}
                            class="mt-1"
                        />
                        <span>Start it once it is created</span>
                    </label>
                    <label class="flex items-start gap-3">
                        <input
                            type="checkbox"
                            name="secureBoot"
                            checked={values?.secureBoot ?? true}
                            class="mt-1"
                        />
                        <span>
                            UEFI secure boot
                            <span class="help block">
                                Some cloud images do not boot with it, like
                                <code class="font-mono">alpine/3.22/cloud</code>: untick it for
                                those. It cannot change.
                            </span>
                        </span>
                    </label>
                    <label class="flex items-start gap-3">
                        <input
                            type="checkbox"
                            name="nesting"
                            checked={values?.nesting ?? false}
                            class="mt-1"
                        />
                        <span>
                            Allow virtual machines or containers inside it
                            <span class="help block">It cannot change.</span>
                        </span>
                    </label>
                </div>
            </details>

            <div class="flex items-center gap-3">
                <button type="submit" class="btn-primary" disabled={full}
                    >Create the instance</button
                >
                <a href={list} class="btn-ghost">Cancel</a>
            </div>
        </form>
    {/if}
</main>
