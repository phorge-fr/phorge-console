<script lang="ts">
    import AutoRefresh from '#lib/components/AutoRefresh.svelte';
    import ConfirmDelete from '#lib/components/ConfirmDelete.svelte';
    import PhaseBadge from '#lib/components/PhaseBadge.svelte';
    import ResourceFields from '#lib/components/ResourceFields.svelte';
    import { describeState, MAX_SSH_KEYS } from '#lib/instances';

    let { data, form } = $props();

    const id = $props.id();
    const instance = $derived(data.instance);
    const field = 'rounded border border-accent bg-bg px-3 py-2 text-fg';
    const list = $derived(`/t/${data.tenant.name}/instances`);
    // The page follows what is being made, started or stopped.
    const busy = $derived(
        instance.phase === 'Provisioning' || instance.phase === 'Deleting' || !!instance.transition
    );
</script>

<svelte:head>
    <title
        >{instance.name} · Instances · {data.tenant.displayName || data.tenant.name} · Phorge console</title
    >
</svelte:head>

<AutoRefresh active={busy} />

<main class="mx-auto max-w-6xl px-4 py-8">
    <p><a href={list}>← All instances</a></p>
    <h1 class="mt-2 font-mono text-3xl font-bold">{instance.name}</h1>
    <p class="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <PhaseBadge phase={instance.phase} />
        <span class="text-muted">{describeState(instance)}</span>
    </p>

    {#if instance.problems}
        <p role="alert" class="mt-4 rounded border-2 border-fg bg-surface p-4">
            <strong>What is wrong:</strong>
            {instance.problems}
        </p>
    {/if}
    {#if instance.phase === 'Failed'}
        <p class="mt-4 rounded border border-accent bg-surface p-4">
            An instance that failed to start for the first time is stuck. Delete it below and create
            it again.
        </p>
    {/if}

    <dl class="mt-8 grid grid-cols-[max-content_1fr] gap-x-6 gap-y-3">
        <dt class="text-muted">Image</dt>
        <dd class="font-mono">{instance.image}</dd>
        <dt class="text-muted">Size</dt>
        <dd>
            {instance.cpu} vCPU, {instance.memoryMiB} MiB of memory, {instance.diskGiB} GiB of disk
        </dd>
        {#if instance.ipv4}
            <dt class="text-muted">Address</dt>
            <dd class="font-mono">{instance.ipv4}</dd>
        {/if}
        <dt class="text-muted">Options</dt>
        <dd>
            Secure boot {instance.secureBoot ? 'on' : 'off'}, nesting {instance.nesting
                ? 'on'
                : 'off'}
        </dd>
        <dt class="text-muted">SSH keys</dt>
        <dd>{instance.sshPublicKeys.length}</dd>
        <dt class="text-muted">Created</dt>
        <dd>
            <time datetime={instance.createdAt}
                >{new Date(instance.createdAt).toLocaleString('en-GB', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                    timeZone: 'UTC'
                })} UTC</time
            >
            {#if instance.createdBy}by {instance.createdBy}{/if}
        </dd>
    </dl>

    {#if instance.phase === 'Deleting'}
        <p class="mt-8">
            This instance is being deleted, with its disk. It disappears from the list when
            everything it is made of is gone.
        </p>
    {:else}
        {#if instance.phase === 'Provisioning'}
            <p class="mt-8">
                This instance is being made, which takes about a minute. This page follows it.
            </p>
        {:else if instance.phase === 'Ready'}
            <section class="mt-10 border-t border-accent pt-8" aria-labelledby="{id}-power">
                <h2 id="{id}-power" class="text-2xl font-bold">Power</h2>
                {#if form?.power?.message}
                    <p role="alert" class="mt-4 max-w-xl rounded border-2 border-fg bg-surface p-4">
                        {form.power.message}
                    </p>
                {/if}
                <form method="POST" action="?/power" class="mt-4">
                    <input type="hidden" name="running" value={String(!instance.running)} />
                    <button
                        type="submit"
                        class="cursor-pointer rounded bg-primary px-5 py-2 font-semibold text-on-primary"
                        >{instance.running ? 'Stop the instance' : 'Start the instance'}</button
                    >
                </form>
                <p class="mt-2 max-w-xl text-sm text-muted">
                    It is the same machine, with the same disk. Right after it started it cannot be
                    stopped yet, because the system inside does not listen before it has booted: try
                    again in a moment.
                </p>
            </section>

            <section class="mt-10 border-t border-accent pt-8" aria-labelledby="{id}-resize">
                <h2 id="{id}-resize" class="text-2xl font-bold">Size</h2>
                {#if form?.resize?.message}
                    <p role="alert" class="mt-4 max-w-xl rounded border-2 border-fg bg-surface p-4">
                        {form.resize.message}
                    </p>
                {:else if form?.resize?.saved}
                    <p
                        role="status"
                        class="mt-4 max-w-xl rounded border border-accent bg-surface p-4"
                    >
                        Saved. The change is applied to the running machine.
                    </p>
                {/if}
                <form method="POST" action="?/resize" class="mt-4 flex max-w-2xl flex-col gap-4">
                    <ResourceFields
                        values={{
                            cpu: instance.cpu,
                            memoryMiB: instance.memoryMiB,
                            diskGiB: instance.diskGiB
                        }}
                        hint="Within the plan of the tenant: the platform refuses what goes over it."
                    />
                    <div>
                        <button
                            type="submit"
                            class="cursor-pointer rounded bg-primary px-5 py-2 font-semibold text-on-primary"
                            >Save the size</button
                        >
                    </div>
                </form>
            </section>

            <section class="mt-10 border-t border-accent pt-8" aria-labelledby="{id}-keys">
                <h2 id="{id}-keys" class="text-2xl font-bold">SSH keys</h2>
                {#if form?.keys?.message}
                    <p role="alert" class="mt-4 max-w-xl rounded border-2 border-fg bg-surface p-4">
                        {form.keys.message}
                    </p>
                {:else if form?.keys?.saved}
                    <p
                        role="status"
                        class="mt-4 max-w-xl rounded border border-accent bg-surface p-4"
                    >
                        Saved.
                    </p>
                {/if}
                <form method="POST" action="?/keys" class="mt-4 flex max-w-2xl flex-col gap-4">
                    <div class="flex flex-col gap-1">
                        <label for="{id}-keys-field" class="font-semibold">Public keys</label>
                        <textarea
                            id="{id}-keys-field"
                            name="sshPublicKeys"
                            rows="4"
                            autocomplete="off"
                            spellcheck="false"
                            class="{field} font-mono text-sm"
                            aria-describedby="{id}-keys-help"
                            >{form?.keys?.text ?? instance.sshPublicKeys.join('\n')}</textarea
                        >
                        <p id="{id}-keys-help" class="text-sm text-muted">
                            One per line, {MAX_SSH_KEYS} at most. What is here replaces the keys of the
                            machine; empty removes them all.
                        </p>
                    </div>
                    <div>
                        <button
                            type="submit"
                            class="cursor-pointer rounded bg-primary px-5 py-2 font-semibold text-on-primary"
                            >Save the keys</button
                        >
                    </div>
                </form>
            </section>
        {/if}

        <section class="mt-10 max-w-xl border-t border-accent pt-8">
            {#if form?.remove?.message}
                <p role="alert" class="mb-4 rounded border-2 border-fg bg-surface p-4">
                    {form.remove.message}
                </p>
            {/if}
            <ConfirmDelete
                name={instance.name}
                what="instance"
                consequence="The virtual machine and its disk are destroyed."
            />
        </section>
    {/if}
</main>
