<script lang="ts">
    import Plus from '@lucide/svelte/icons/plus';
    import Alert from '#lib/components/Alert.svelte';
    import AutoRefresh from '#lib/components/AutoRefresh.svelte';
    import EmptyState from '#lib/components/EmptyState.svelte';
    import PageHeader from '#lib/components/PageHeader.svelte';
    import PhaseBadge from '#lib/components/PhaseBadge.svelte';
    import ResourceFields from '#lib/components/ResourceFields.svelte';
    import SettingsSection from '#lib/components/SettingsSection.svelte';
    import {
        describeState,
        INSTANCE_NAME_PATTERN,
        MAX_SSH_KEYS,
        SIZES,
        usageOf
    } from '#lib/instances';
    import { PLANS } from '#lib/plans';

    let { data, form } = $props();

    const id = $props.id();
    const base = $derived(`/t/${data.tenant.name}/instances`);
    const plan = $derived(PLANS[data.tenant.plan]);
    const values = $derived(form?.create?.values);
    const usage = $derived(usageOf(data.instances));
    // What the plan still has room for: a ready-made size that does not fit is shown, and cannot be chosen.
    const left = $derived({
        instances: plan.instances - usage.instances,
        vcpu: plan.vcpu - usage.vcpu,
        memoryGiB: plan.memoryGiB - usage.memoryGiB,
        diskGiB: plan.diskGiB - usage.diskGiB
    });
    const full = $derived(left.instances <= 0);
    const fits = (size: (typeof SIZES)[keyof typeof SIZES]) =>
        !full &&
        size.cpu <= left.vcpu &&
        size.memoryMiB / 1024 <= left.memoryGiB &&
        size.diskGiB <= left.diskGiB;
    const firstFit = $derived(
        (Object.keys(SIZES) as (keyof typeof SIZES)[]).find((name) => fits(SIZES[name])) ??
            'standard'
    );
    const chosen = $derived(values?.size ?? firstFit);
    // A list that follows what is being made, started, stopped or deleted.
    const busy = $derived(
        data.instances.some(
            (instance) =>
                instance.phase === 'Provisioning' ||
                instance.phase === 'Deleting' ||
                instance.transition
        )
    );
</script>

<svelte:head>
    <title>Instances · {data.tenant.displayName || data.tenant.name} · Phorge console</title>
</svelte:head>

<AutoRefresh active={busy} />

<main class="mx-auto w-full max-w-5xl px-4 py-8 md:px-10">
    <PageHeader
        title="Instances"
        subtitle="The virtual machines of this tenant, each with its own disk."
    >
        {#snippet actions()}
            <a href="#create" class="btn-primary">
                <Plus size={16} aria-hidden="true" />
                Create an instance
            </a>
        {/snippet}
    </PageHeader>

    {#if data.instances.length === 0}
        <EmptyState title="No instance yet">
            <p>Create a virtual machine from one of your images. It is ready in about a minute.</p>
            {#snippet action()}
                <a href="#create" class="btn-primary">Create an instance</a>
            {/snippet}
        </EmptyState>
    {:else}
        <div class="panel overflow-hidden">
            <table class="w-full border-collapse text-left">
                <thead class="sr-only md:table-header-group md:not-sr-only">
                    <tr class="border-b border-line bg-surface text-sm text-fg-3">
                        <th scope="col" class="px-4 py-2.5 font-semibold">Name</th>
                        <th scope="col" class="px-4 py-2.5 font-semibold">State</th>
                        <th scope="col" class="px-4 py-2.5 font-semibold">Image</th>
                        <th scope="col" class="px-4 py-2.5 font-semibold">Size</th>
                        <th scope="col" class="px-4 py-2.5 font-semibold">Address</th>
                    </tr>
                </thead>
                <tbody class="block md:table-row-group">
                    {#each data.instances as instance (instance.name)}
                        <tr
                            class="relative block border-b border-line px-4 py-3 last:border-b-0 hover:bg-surface md:table-row md:px-0 md:py-0"
                        >
                            <td class="block py-0.5 md:table-cell md:px-4 md:py-3.5">
                                <a
                                    href="{base}/{instance.name}"
                                    class="font-mono font-semibold text-fg no-underline after:absolute after:inset-0 after:content-['']"
                                    >{instance.name}</a
                                >
                            </td>
                            <td class="block py-1 md:table-cell md:px-4 md:py-3.5">
                                <span class="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
                                    <PhaseBadge phase={instance.phase} />
                                    {#if describeState(instance)}
                                        <span class="text-sm text-fg-2"
                                            >{describeState(instance)}</span
                                        >
                                    {/if}
                                </span>
                            </td>
                            <td
                                class="block py-0.5 font-mono text-sm text-fg-2 md:table-cell md:px-4 md:py-3.5"
                            >
                                {instance.image}
                            </td>
                            <td
                                class="tnum block py-0.5 text-sm text-fg-2 md:table-cell md:px-4 md:py-3.5"
                            >
                                {instance.cpu} vCPU · {instance.memoryMiB / 1024} GiB · {instance.diskGiB}
                                GiB
                            </td>
                            <td
                                class="block py-0.5 font-mono text-sm text-fg-2 md:table-cell md:px-4 md:py-3.5"
                            >
                                {instance.ipv4 ?? '—'}
                            </td>
                        </tr>
                        {#if instance.problems}
                            <tr
                                class="block border-b border-line px-4 pb-3 last:border-b-0 md:table-row md:p-0"
                            >
                                <td colspan="5" class="block md:table-cell md:px-4 md:pb-3.5">
                                    <Alert tone="danger" title="What is wrong"
                                        >{instance.problems}</Alert
                                    >
                                </td>
                            </tr>
                        {/if}
                    {/each}
                </tbody>
            </table>
        </div>
    {/if}

    <div class="mt-12" id="create">
        <SettingsSection
            title="Create an instance"
            description="A virtual machine that starts from one of the images of this tenant."
        >
            {#if data.images.length === 0}
                <Alert tone="info" title="You need an image first">
                    A virtual machine starts from an image that is ready, and this tenant has none.
                    <a href="/t/{data.tenant.name}/images#pull">Pull an image</a>, then come back.
                </Alert>
            {:else}
                {#if full}
                    <div class="mb-5 max-w-xl">
                        <Alert tone="warning" title="The plan has no room left">
                            The plan {data.tenant.plan} allows {plan.instances}
                            {plan.instances === 1 ? 'virtual machine' : 'virtual machines'}, and
                            this tenant has {usage.instances}. Delete one to create another.
                        </Alert>
                    </div>
                {/if}
                {#if form?.create?.message}
                    <div class="mb-5 max-w-xl">
                        <Alert tone="danger">{form.create.message}</Alert>
                    </div>
                {/if}

                <form method="POST" action="?/create" class="flex max-w-xl flex-col gap-6">
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
                            Lowercase letters, digits and hyphens, starting with a letter. It cannot
                            change.
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

                    <fieldset class="m-0 flex min-w-0 flex-col gap-2 border-0 p-0">
                        <legend class="field-label mb-2 p-0">Size</legend>
                        {#each Object.entries(SIZES) as [key, size] (key)}
                            {@const ok = fits(size)}
                            <label
                                class="flex items-start gap-3 rounded-lg border border-line bg-bg p-3.5 transition-colors duration-150 has-[:checked]:border-primary has-[:checked]:bg-highlight {ok
                                    ? 'cursor-pointer hover:bg-surface'
                                    : 'opacity-60'}"
                            >
                                <input
                                    type="radio"
                                    name="size"
                                    value={key}
                                    checked={chosen === key}
                                    disabled={!ok}
                                    class="mt-1"
                                />
                                <span class="tnum">
                                    <span class="block font-semibold">{size.label}</span>
                                    <span class="block text-fg-2">
                                        {size.cpu} vCPU · {size.memoryMiB / 1024} GiB of memory · {size.diskGiB}
                                        GiB of disk
                                    </span>
                                    {#if !ok}
                                        <span class="block text-sm text-warn-fg">
                                            {full
                                                ? 'The plan is full'
                                                : 'More than what is left in the plan'}
                                        </span>
                                    {/if}
                                </span>
                            </label>
                        {/each}
                        <label
                            class="flex cursor-pointer items-start gap-3 rounded-lg border border-line bg-bg p-3.5 transition-colors duration-150 hover:bg-surface has-[:checked]:border-primary has-[:checked]:bg-highlight"
                        >
                            <input
                                type="radio"
                                name="size"
                                value="custom"
                                checked={chosen === 'custom'}
                                class="mt-1"
                            />
                            <span>
                                <span class="block font-semibold">Custom</span>
                                <span class="block text-fg-2"
                                    >Choose the numbers yourself, below.</span
                                >
                            </span>
                        </label>
                        <details class="mt-1" open={chosen === 'custom'}>
                            <summary class="cursor-pointer text-sm font-semibold text-fg-2">
                                Custom size
                            </summary>
                            <div class="mt-3">
                                <ResourceFields
                                    values={{
                                        cpu: values?.cpu ?? '',
                                        memoryMiB: values?.memoryMiB ?? '',
                                        diskGiB: values?.diskGiB ?? ''
                                    }}
                                    hint="Used when Custom is chosen. An empty field takes the default: 1 vCPU, 1024 MiB, 10 GiB."
                                />
                            </div>
                        </details>
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
                            aria-describedby="{id}-keys-help"
                            >{values?.sshPublicKeys ?? ''}</textarea
                        >
                        <p id="{id}-keys-help" class="help">
                            One per line, {MAX_SSH_KEYS} at most. They are put in the machine when it
                            starts, so the image must be a <code class="font-mono">cloud</code> variant.
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
                                        <code class="font-mono">alpine/3.22/cloud</code>: untick it
                                        for those. It cannot change.
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

                    <div>
                        <button type="submit" class="btn-primary" disabled={full}
                            >Create the instance</button
                        >
                    </div>
                </form>
            {/if}
        </SettingsSection>
    </div>
</main>
