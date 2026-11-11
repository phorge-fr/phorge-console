<script lang="ts">
    import Alert from '#lib/components/Alert.svelte';
    import ChipPicker from '#lib/components/ChipPicker.svelte';
    import PageHeader from '#lib/components/PageHeader.svelte';
    import ResourceFields from '#lib/components/ResourceFields.svelte';
    import SshKeysField from '#lib/components/SshKeysField.svelte';
    import { INSTANCE_NAME_PATTERN } from '#lib/instances';
    import { MAX_INSTANCE_NETWORKS, networkChoice } from '#lib/networks';
    import { describeSize } from '#lib/profiles';
    import { onMount, untrack } from 'svelte';
    import { SvelteSet } from 'svelte/reactivity';

    let { data, form } = $props();

    const id = $props.id();
    const list = $derived(`/t/${data.tenant.name}/instances`);
    const values = $derived(form?.values);
    const quota = $derived(data.quota);
    // The networks picked, in the order they were picked, which is the order of the network cards: what the person chose before an
    // error, or the only network of the tenant. The picker needs JavaScript; without it the form shows plain checkboxes.
    const chosen = new SvelteSet<string>(
        untrack(
            () => values?.networks ?? (data.networks.length === 1 ? [data.networks[0].name] : [])
        )
    );
    const choices = $derived(data.networks.map(networkChoice));
    let mounted = $state(false);
    onMount(() => (mounted = true));
    // The size: a profile of the tenant, or a custom size. The profile `s` is the first choice; without profiles the size is custom.
    let size = $state(
        untrack(
            () =>
                form?.values?.size ??
                (data.profiles.some((profile) => profile.name === 's')
                    ? 's'
                    : (data.profiles[0]?.name ?? 'custom'))
        )
    );
    // What the plan still has room for, said under the size so that the person knows what fits.
    const left = $derived(
        quota && {
            instances: quota.limits.instances - quota.used.instances,
            vcpu: quota.limits.vcpu - quota.used.vcpu,
            memoryGiB: (quota.limits.memoryMiB - quota.used.memoryMiB) / 1024,
            diskGiB: quota.limits.diskGiB - quota.used.diskGiB
        }
    );
    const full = $derived(left !== undefined && left.instances <= 0);
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
                    The plan {quota?.plan} allows {quota?.limits.instances}
                    {quota?.limits.instances === 1 ? 'virtual machine' : 'virtual machines'}, and
                    this tenant has {quota?.used.instances}. Delete one to create another.
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

            <div class="flex flex-col gap-2">
                <label for="{id}-network-search" class="field-label">Networks</label>
                {#if mounted}
                    {#each [...chosen] as name (name)}
                        <input type="hidden" name="networks" value={name} />
                    {/each}
                    <ChipPicker
                        id="{id}-network-search"
                        items={choices}
                        {chosen}
                        noun="network"
                        empty="No network yet. Search below and pick the ones the machine is attached to."
                        placeholder="Search a network to add"
                        mono
                        ordinal={(index) => `eth${index}`}
                        max={MAX_INSTANCE_NETWORKS}
                    />
                {:else}
                    <!-- Without JavaScript the networks are checkboxes, in the order of the list: the first one ticked is eth0. -->
                    <noscript>
                        <div class="flex flex-col gap-2">
                            {#each data.networks as network (network.name)}
                                <label class="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        name="networks"
                                        value={network.name}
                                        checked={chosen.has(network.name)}
                                    />
                                    <span class="font-mono">{network.name}</span>
                                </label>
                            {/each}
                        </div>
                    </noscript>
                {/if}
                <p class="help">
                    Only the networks that are ready, {MAX_INSTANCE_NETWORKS} at most. The machine gets
                    one network card for each, in the order of the chips: the first one is
                    <code class="font-mono">eth0</code>. They can be changed later, from the page of
                    the machine. <a href="/t/{data.tenant.name}/networks/new">Create another</a>.
                </p>
            </div>

            <fieldset class="m-0 flex min-w-0 flex-col gap-3 border-0 p-0">
                <legend class="field-label mb-2 p-0">Size</legend>
                {#if data.profiles.length}
                    <div class="flex flex-col gap-1.5">
                        <label for="{id}-size" class="sr-only">Size</label>
                        <select
                            id="{id}-size"
                            name="size"
                            bind:value={size}
                            class="field max-w-md"
                            aria-describedby="{id}-size-help"
                        >
                            {#each data.profiles as profile (profile.name)}
                                <option value={profile.name}>
                                    {profile.name} · {describeSize(profile)}
                                </option>
                            {/each}
                            <option value="custom">Custom size…</option>
                        </select>
                        <p id="{id}-size-help" class="help">
                            A profile of this tenant, or your own size.
                            <a href="/t/{data.tenant.name}/profiles">See the profiles</a>.
                        </p>
                    </div>
                {:else}
                    <input type="hidden" name="size" value="custom" />
                {/if}
                {#if size === 'custom'}
                    <ResourceFields
                        values={{
                            cpu: values?.cpu ?? '',
                            memoryMiB: values?.memoryMiB ?? '',
                            diskGiB: values?.diskGiB ?? ''
                        }}
                        hint="An empty field takes the default: 1 vCPU, 1024 MiB, 10 GiB."
                    />
                {/if}
                {#if left}
                    <p class="help tnum">
                        Left in the plan: {Math.max(left.instances, 0)}
                        {left.instances === 1 ? 'VM' : 'VMs'}, {Math.max(left.vcpu, 0)} vCPU, {Math.max(
                            Math.round(left.memoryGiB * 10) / 10,
                            0
                        )} GiB of memory, {Math.max(left.diskGiB, 0)} GiB of disk.
                    </p>
                {/if}
            </fieldset>

            <SshKeysField {id} value={values?.sshPublicKeys ?? ''}>
                They are put in the machine when it starts, so the image must be a
                <code class="font-mono">cloud</code> variant.
            </SshKeysField>

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
