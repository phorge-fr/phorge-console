<script lang="ts">
    import AutoRefresh from '#lib/components/AutoRefresh.svelte';
    import EmptyState from '#lib/components/EmptyState.svelte';
    import PhaseBadge from '#lib/components/PhaseBadge.svelte';
    import ResourceFields from '#lib/components/ResourceFields.svelte';
    import { describeState, INSTANCE_NAME_PATTERN, MAX_SSH_KEYS } from '#lib/instances';
    import { PLANS } from '#lib/plans';

    let { data, form } = $props();

    const id = $props.id();
    const field = 'rounded border border-accent bg-bg px-3 py-2 text-fg';
    const plan = $derived(PLANS[data.tenant.plan]);
    const values = $derived(form?.create?.values);
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

<main class="mx-auto max-w-6xl px-4 py-8">
    <h1 class="text-3xl font-bold">Instances</h1>
    <p class="mt-3 max-w-3xl text-muted">
        The virtual machines of this tenant. Each one starts from an image of the tenant and keeps
        its own disk. Creating and changing them is for users, operators and administrators of the
        tenant.
    </p>

    <section class="mt-8" aria-labelledby="{id}-list">
        <h2 id="{id}-list" class="sr-only">The instances</h2>
        {#if data.instances.length === 0}
            <EmptyState title="No instance yet">
                Create one below. It takes about a minute to be ready.
            </EmptyState>
        {:else}
            <ul class="flex flex-col gap-4">
                {#each data.instances as instance (instance.name)}
                    <li class="rounded border border-accent bg-surface p-4">
                        <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
                            <h3 class="font-mono text-lg font-bold">
                                <a href="/t/{data.tenant.name}/instances/{instance.name}"
                                    >{instance.name}</a
                                >
                            </h3>
                            <PhaseBadge phase={instance.phase} />
                            <span class="text-muted">{describeState(instance)}</span>
                        </div>
                        <p class="mt-2 text-muted">
                            Image <span class="font-mono">{instance.image}</span> · {instance.cpu}
                            vCPU · {instance.memoryMiB} MiB · {instance.diskGiB} GiB
                            {#if instance.ipv4}· <span class="font-mono">{instance.ipv4}</span>{/if}
                        </p>
                        {#if instance.problems}
                            <p role="alert" class="mt-3 rounded border-2 border-fg bg-bg p-3">
                                <strong>What is wrong:</strong>
                                {instance.problems}
                            </p>
                        {/if}
                    </li>
                {/each}
            </ul>
        {/if}
    </section>

    <section class="mt-12 border-t border-accent pt-8" aria-labelledby="{id}-create">
        <h2 id="{id}-create" class="text-2xl font-bold">Create an instance</h2>
        <p class="mt-2 max-w-3xl text-muted">
            The plan of this tenant, <strong>{data.tenant.plan}</strong>, allows {plan.instances}
            {plan.instances === 1 ? 'VM' : 'VMs'}, {plan.vcpu} vCPU, {plan.memoryGiB} GiB of memory and
            {plan.diskGiB} GiB of disk in all, stopped VMs included. The platform checks it after the
            request: an instance that goes over it becomes <em>Failed</em> and says why.
        </p>

        {#if data.images.length === 0}
            <p class="mt-6 max-w-xl rounded border border-accent bg-surface p-4">
                An instance starts from an image of the tenant that is ready, and there is none.
                <a href="/t/{data.tenant.name}/images">Pull an image</a> first.
            </p>
        {:else}
            {#if form?.create?.message}
                <p role="alert" class="mt-4 max-w-xl rounded border-2 border-fg bg-surface p-4">
                    {form.create.message}
                </p>
            {/if}

            <form method="POST" action="?/create" class="mt-4 flex max-w-2xl flex-col gap-5">
                <div class="flex flex-col gap-1">
                    <label for="{id}-name" class="font-semibold">Name</label>
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
                        class="{field} max-w-sm font-mono"
                        aria-describedby="{id}-name-help"
                    />
                    <p id="{id}-name-help" class="text-sm text-muted">
                        Lowercase letters, digits and hyphens, starting with a letter. It cannot
                        change.
                    </p>
                </div>

                <div class="flex flex-col gap-1">
                    <label for="{id}-image" class="font-semibold">Image</label>
                    <select
                        id="{id}-image"
                        name="image"
                        required
                        class="{field} max-w-sm font-mono"
                        aria-describedby="{id}-image-help"
                    >
                        {#each data.images as image (image.name)}
                            <option value={image.name} selected={values?.image === image.name}>
                                {image.name} ({image.source.name})
                            </option>
                        {/each}
                    </select>
                    <p id="{id}-image-help" class="text-sm text-muted">
                        Only the images that are ready. It cannot change: to use another one, delete
                        the instance and create another.
                    </p>
                </div>

                <ResourceFields
                    values={{
                        cpu: values?.cpu ?? '',
                        memoryMiB: values?.memoryMiB ?? '',
                        diskGiB: values?.diskGiB ?? ''
                    }}
                    hint="Leave a field empty for the default (1 vCPU, 1024 MiB, 10 GiB)."
                />

                <div class="flex flex-col gap-1">
                    <label for="{id}-keys" class="font-semibold">SSH public keys (optional)</label>
                    <textarea
                        id="{id}-keys"
                        name="sshPublicKeys"
                        rows="3"
                        autocomplete="off"
                        spellcheck="false"
                        class="{field} font-mono text-sm"
                        aria-describedby="{id}-keys-help">{values?.sshPublicKeys ?? ''}</textarea
                    >
                    <p id="{id}-keys-help" class="text-sm text-muted">
                        One per line, like <code class="font-mono">ssh-ed25519 AAAA… name</code>,
                        {MAX_SSH_KEYS} at most. They are put in the VM when it starts, so the image must
                        be a <code class="font-mono">cloud</code> variant.
                    </p>
                </div>

                <fieldset class="flex flex-col gap-2 border-0 p-0">
                    <legend class="font-semibold">Options</legend>
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
                            <span class="block text-sm text-muted">
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
                            <span class="block text-sm text-muted">It cannot change.</span>
                        </span>
                    </label>
                </fieldset>

                <div>
                    <button
                        type="submit"
                        class="cursor-pointer rounded bg-primary px-5 py-2 font-semibold text-on-primary"
                        >Create the instance</button
                    >
                </div>
            </form>
        {/if}
    </section>
</main>
