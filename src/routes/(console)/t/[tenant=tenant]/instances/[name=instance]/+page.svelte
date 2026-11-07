<script lang="ts">
    import Play from '@lucide/svelte/icons/play';
    import Square from '@lucide/svelte/icons/square';
    import Alert from '#lib/components/Alert.svelte';
    import AutoRefresh from '#lib/components/AutoRefresh.svelte';
    import ConfirmDelete from '#lib/components/ConfirmDelete.svelte';
    import PageHeader from '#lib/components/PageHeader.svelte';
    import InstanceStatus from '#lib/components/InstanceStatus.svelte';
    import ResourceFields from '#lib/components/ResourceFields.svelte';
    import SettingsSection from '#lib/components/SettingsSection.svelte';
    import { MAX_SSH_KEYS } from '#lib/instances';

    let { data, form } = $props();

    const id = $props.id();
    const instance = $derived(data.instance);
    const list = $derived(`/t/${data.tenant.name}/instances`);
    const notices = $derived(
        !!form?.power?.message || !!instance.problems || instance.phase !== 'Ready'
    );
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

<main class="mx-auto w-full max-w-5xl px-4 py-8 md:px-10">
    <PageHeader title={instance.name} back={{ href: list, label: 'All instances' }}>
        {#snippet status()}
            <InstanceStatus {instance} />
        {/snippet}
        {#snippet actions()}
            {#if instance.phase === 'Ready'}
                <form method="POST" action="?/power">
                    <input type="hidden" name="running" value={String(!instance.running)} />
                    {#if instance.running}
                        <button type="submit" class="btn-secondary">
                            <Square size={14} aria-hidden="true" />
                            Stop
                        </button>
                    {:else}
                        <button type="submit" class="btn-primary">
                            <Play size={14} aria-hidden="true" />
                            Start
                        </button>
                    {/if}
                </form>
            {/if}
        {/snippet}
    </PageHeader>

    <div class="mb-8 flex flex-col gap-3" hidden={!notices}>
        {#if form?.power?.message}
            <Alert
                tone="warning"
                title="The machine was not {instance.running ? 'stopped' : 'started'}"
            >
                {form.power.message}
            </Alert>
        {/if}
        {#if instance.problems}
            <Alert tone="danger" title="What is wrong">{instance.problems}</Alert>
        {/if}
        {#if instance.phase === 'Failed'}
            <Alert tone="info" title="This instance cannot recover">
                An instance that failed to start for the first time is stuck. Delete it below and
                create it again.
            </Alert>
        {:else if instance.phase === 'Provisioning'}
            <Alert tone="info"
                >This instance is being made, which takes about a minute. This page follows it.</Alert
            >
        {:else if instance.phase === 'Deleting'}
            <Alert tone="info">
                This instance is being deleted, with its disk. It disappears from the list when
                everything it is made of is gone.
            </Alert>
        {/if}
    </div>

    <SettingsSection title="Overview">
        <dl class="grid grid-cols-[max-content_minmax(0,1fr)] gap-x-8 gap-y-3">
            <dt class="text-fg-3">Image</dt>
            <dd class="font-mono">{instance.image}</dd>
            <dt class="text-fg-3">Size</dt>
            <dd class="tnum">
                {instance.cpu} vCPU · {instance.memoryMiB / 1024} GiB of memory · {instance.diskGiB} GiB
                of disk
            </dd>
            <dt class="text-fg-3">Address</dt>
            <dd class="font-mono">{instance.ipv4 ?? '—'}</dd>
            <dt class="text-fg-3">Options</dt>
            <dd>
                Secure boot {instance.secureBoot ? 'on' : 'off'} · nesting {instance.nesting
                    ? 'on'
                    : 'off'}
            </dd>
            <dt class="text-fg-3">SSH keys</dt>
            <dd class="tnum">{instance.sshPublicKeys.length}</dd>
            <dt class="text-fg-3">Created</dt>
            <dd>
                <time datetime={instance.createdAt}
                    >{new Date(instance.createdAt).toLocaleString('en-GB', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                        timeZone: 'UTC'
                    })} UTC</time
                >
                {#if instance.createdBy}<span class="text-fg-2">by {instance.createdBy}</span>{/if}
            </dd>
        </dl>
    </SettingsSection>

    {#if instance.phase === 'Ready'}
        <SettingsSection
            title="Size"
            description="Applied to the running machine. The plan of the tenant sets the limit."
        >
            {#if form?.resize?.message}
                <div class="mb-5 max-w-xl"><Alert tone="danger">{form.resize.message}</Alert></div>
            {:else if form?.resize?.saved}
                <div class="mb-5 max-w-xl">
                    <Alert tone="info">Saved. The change is applied to the running machine.</Alert>
                </div>
            {/if}
            <form method="POST" action="?/resize" class="flex max-w-xl flex-col gap-5">
                <ResourceFields
                    values={{
                        cpu: instance.cpu,
                        memoryMiB: instance.memoryMiB,
                        diskGiB: instance.diskGiB
                    }}
                />
                <div><button type="submit" class="btn-primary">Save the size</button></div>
            </form>
        </SettingsSection>

        <SettingsSection
            title="SSH keys"
            description="What is here replaces the keys of the machine. Empty removes them all."
        >
            {#if form?.keys?.message}
                <div class="mb-5 max-w-xl"><Alert tone="danger">{form.keys.message}</Alert></div>
            {:else if form?.keys?.saved}
                <div class="mb-5 max-w-xl"><Alert tone="info">Saved.</Alert></div>
            {/if}
            <form method="POST" action="?/keys" class="flex max-w-xl flex-col gap-4">
                <div class="flex flex-col gap-1.5">
                    <label for="{id}-keys" class="field-label">Public keys</label>
                    <textarea
                        id="{id}-keys"
                        name="sshPublicKeys"
                        rows="4"
                        autocomplete="off"
                        spellcheck="false"
                        class="field h-auto min-h-24 py-2 font-mono text-sm"
                        aria-describedby="{id}-keys-help"
                        >{form?.keys?.text ?? instance.sshPublicKeys.join('\n')}</textarea
                    >
                    <p id="{id}-keys-help" class="help">One per line, {MAX_SSH_KEYS} at most.</p>
                </div>
                <div><button type="submit" class="btn-primary">Save the keys</button></div>
            </form>
        </SettingsSection>
    {/if}

    {#if instance.phase !== 'Deleting'}
        <SettingsSection
            title="Delete this instance"
            description="The virtual machine and its disk are destroyed."
        >
            <div class="max-w-xl">
                {#if form?.remove?.message}
                    <div class="mb-4"><Alert tone="danger">{form.remove.message}</Alert></div>
                {/if}
                <ConfirmDelete
                    name={instance.name}
                    what="instance"
                    consequence="The virtual machine and its disk are destroyed."
                />
            </div>
        </SettingsSection>
    {/if}
</main>
