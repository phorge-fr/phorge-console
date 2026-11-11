<script lang="ts">
    import { onMount } from 'svelte';
    import LoaderCircle from '@lucide/svelte/icons/loader-circle';
    import Play from '@lucide/svelte/icons/play';
    import Square from '@lucide/svelte/icons/square';
    import SquareTerminal from '@lucide/svelte/icons/square-terminal';
    import Alert from '#lib/components/Alert.svelte';
    import AutoRefresh from '#lib/components/AutoRefresh.svelte';
    import ConfirmDelete from '#lib/components/ConfirmDelete.svelte';
    import PageHeader from '#lib/components/PageHeader.svelte';
    import InstanceStatus from '#lib/components/InstanceStatus.svelte';
    import ResourceFields from '#lib/components/ResourceFields.svelte';
    import SearchPicker from '#lib/components/SearchPicker.svelte';
    import SettingsSection from '#lib/components/SettingsSection.svelte';
    import { MAX_SSH_KEYS } from '#lib/instances';
    import { MAX_INSTANCE_NETWORKS, networkChoice } from '#lib/networks';
    import { describeSize } from '#lib/profiles';

    let { data, form } = $props();

    const id = $props.id();
    const instance = $derived(data.instance);
    const list = $derived(`/t/${data.tenant.name}/instances`);
    const notices = $derived(
        !!form?.power?.message || !!instance.problems || instance.phase !== 'Ready'
    );
    // The ready networks the machine is not on yet: what can be added.
    const attached = $derived(instance.networks ?? []);
    const addable = $derived(
        data.networks.filter((network) => !attached.some((one) => one.name === network.name))
    );
    const choices = $derived(addable.map(networkChoice));
    // Adding is picking a result: the form posts that network. Without JavaScript the page has a plain select instead.
    let mounted = $state(false);
    onMount(() => (mounted = true));
    let addForm = $state<HTMLFormElement>();
    let addField = $state<HTMLInputElement>();
    function add(name: string) {
        if (!addForm || !addField) return;
        addField.value = name;
        addForm.requestSubmit();
    }
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
            {#if instance.phase === 'Ready' && instance.state === 'Running' && !instance.transition}
                <!-- A comfort: the API refuses a terminal whoever asks and whatever the state. -->
                <a href="{list}/{instance.name}/terminal" class="btn-secondary">
                    <SquareTerminal size={14} aria-hidden="true" />
                    Terminal
                </a>
            {/if}
            {#if instance.phase === 'Ready'}
                {#if instance.transition}
                    <!-- A change is under way: the button cannot be used until the machine is where it was asked to be. -->
                    <button type="button" class="btn-secondary" disabled aria-busy="true">
                        <LoaderCircle size={14} class="animate-spin" aria-hidden="true" />
                        {instance.transition === 'starting' ? 'Starting…' : 'Stopping…'}
                    </button>
                {:else}
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
            {/if}
        {/snippet}
    </PageHeader>

    <div class="mb-8 flex flex-col gap-3" hidden={!notices}>
        {#if form?.power?.message}
            <Alert tone="info" title="Not yet">{form.power.message}</Alert>
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
                {#if instance.profile}
                    <span class="font-mono font-semibold">{instance.profile}</span> ·
                {/if}
                {instance.cpu} vCPU · {instance.memoryMiB / 1024} GiB of memory · {instance.diskGiB} GiB
                of disk
            </dd>
            <dt class="text-fg-3">{attached.length > 1 ? 'Networks' : 'Network'}</dt>
            <dd class="flex flex-col gap-1">
                {#each attached as network, index (network.name)}
                    <span>
                        <a href="/t/{data.tenant.name}/networks" class="font-mono">{network.name}</a
                        >
                        <span class="text-fg-3">eth{index}</span>
                        <span class="font-mono text-fg-2">
                            {network.ipv4 ?? '—'}{#if network.ipv6}
                                · {network.ipv6}{/if}
                        </span>
                    </span>
                {:else}
                    —
                {/each}
            </dd>
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
            description="A bigger size is applied to the running machine. To lower the memory, stop the machine first. The limits of the tenant bound it."
        >
            {#if data.profiles.length}
                {#if form?.profile?.message}
                    <div class="mb-5 max-w-xl">
                        <Alert tone="danger">{form.profile.message}</Alert>
                    </div>
                {:else if form?.profile?.saved}
                    <div class="mb-5 max-w-xl">
                        <Alert tone="info">Saved. The machine takes the size of the profile.</Alert>
                    </div>
                {/if}
                <form method="POST" action="?/profile" class="mb-8 flex max-w-xl flex-col gap-3">
                    <label for="{id}-profile" class="field-label">Profile</label>
                    <div class="flex gap-2">
                        <select id="{id}-profile" name="profile" required class="field max-w-md">
                            {#if !instance.profile}
                                <option value="" selected disabled>Choose a profile…</option>
                            {/if}
                            {#each data.profiles as profile (profile.name)}
                                <option
                                    value={profile.name}
                                    selected={profile.name === instance.profile}
                                >
                                    {profile.name} · {describeSize(profile)}
                                </option>
                            {/each}
                        </select>
                        <button type="submit" class="btn-secondary shrink-0"
                            >Use this profile</button
                        >
                    </div>
                    <p class="help">
                        {#if instance.profile}
                            This machine has the profile {instance.profile}. Giving it a size below
                            takes it out of the profile.
                        {:else}
                            This machine has its own size. A profile replaces it.
                        {/if}
                    </p>
                </form>
            {/if}
            {#if form?.resize?.message}
                <div class="mb-5 max-w-xl"><Alert tone="danger">{form.resize.message}</Alert></div>
            {:else if form?.resize?.saved}
                <div class="mb-5 max-w-xl">
                    <Alert tone="info">Saved. The new size is applied.</Alert>
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
            title="Networks"
            description="Changed on the running machine: it is not stopped or restarted."
        >
            {#if form?.networks?.message}
                <div class="mb-5 max-w-xl">
                    <Alert tone="danger">{form.networks.message}</Alert>
                </div>
            {:else if form?.networks?.saved}
                <div class="mb-5 max-w-xl">
                    <Alert tone="info">
                        Saved. A network card that is added stays down in the machine until the
                        machine configures it, and a restart does it.
                    </Alert>
                </div>
            {/if}
            <ul class="mb-6 flex max-w-xl flex-col divide-y divide-line border-y border-line">
                {#each attached as network, index (network.name)}
                    <li class="flex items-center justify-between gap-3 py-2.5">
                        <span>
                            <span class="font-mono">{network.name}</span>
                            <span class="text-fg-3">eth{index}</span>
                        </span>
                        <form method="POST" action="?/removeNetwork">
                            <input type="hidden" name="network" value={network.name} />
                            <button
                                type="submit"
                                class="btn-secondary"
                                disabled={attached.length <= 1}
                                aria-label="Take {network.name} off the machine"
                            >
                                Remove
                            </button>
                        </form>
                    </li>
                {/each}
            </ul>
            {#if addable.length && attached.length < MAX_INSTANCE_NETWORKS}
                <form
                    method="POST"
                    action="?/addNetwork"
                    bind:this={addForm}
                    class="flex max-w-xl flex-col gap-2"
                >
                    <label for="{id}-network" class="field-label">Add a network</label>
                    {#if mounted}
                        <!-- Picking a result adds it: the network is the one the form sends. -->
                        <input type="hidden" name="network" bind:this={addField} />
                        <SearchPicker
                            id="{id}-network"
                            items={choices}
                            noun="network"
                            placeholder="Search a network to add"
                            mono
                            onpick={add}
                        />
                    {:else}
                        <noscript>
                            <div class="flex gap-2">
                                <select
                                    id="{id}-network"
                                    name="network"
                                    required
                                    class="field max-w-md font-mono"
                                >
                                    {#each addable as network (network.name)}
                                        <option value={network.name}>{network.name}</option>
                                    {/each}
                                </select>
                                <button type="submit" class="btn-secondary shrink-0">Add</button>
                            </div>
                        </noscript>
                    {/if}
                    <p class="help">
                        Only the networks that are ready, after the ones the machine has. The
                        machine keeps at least one network, and when one is taken out the cards that
                        follow it are renamed at the next start.
                    </p>
                </form>
            {:else}
                <p class="help">
                    {#if attached.length >= MAX_INSTANCE_NETWORKS}
                        A machine is attached to {MAX_INSTANCE_NETWORKS} networks at most.
                    {:else}
                        No other network is ready.
                        <a href="/t/{data.tenant.name}/networks/new">Create a network</a>.
                    {/if}
                </p>
            {/if}
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
