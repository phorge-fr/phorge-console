<script lang="ts">
    import Alert from '#lib/components/Alert.svelte';
    import AutoRefresh from '#lib/components/AutoRefresh.svelte';
    import ConfirmDelete from '#lib/components/ConfirmDelete.svelte';
    import InstanceStatus from '#lib/components/InstanceStatus.svelte';
    import PageHeader from '#lib/components/PageHeader.svelte';
    import PhaseBadge from '#lib/components/PhaseBadge.svelte';
    import SettingsSection from '#lib/components/SettingsSection.svelte';

    let { data, form } = $props();

    const profile = $derived(data.profile);
    const list = $derived(`/t/${data.tenant.name}/profiles`);
    const instances = $derived(data.instances);
    // The page follows a profile that is being made or deleted.
    const busy = $derived(profile.phase === 'Provisioning' || profile.phase === 'Deleting');
    // Said next to the form, so that the person knows before the API refuses.
    const consequence = $derived(
        instances?.length
            ? `${instances.length === 1 ? 'A virtual machine has' : `${instances.length} virtual machines have`} this profile: the deletion is refused until you move ${instances.length === 1 ? 'it' : 'them'} to another size. You can make the profile again later.`
            : 'The deletion is refused while a virtual machine has this profile. You can make the profile again later.'
    );
</script>

<svelte:head>
    <title
        >{profile.name} · Profiles · {data.tenant.displayName || data.tenant.name} · Phorge console</title
    >
</svelte:head>

<AutoRefresh active={busy} />

<main class="mx-auto w-full max-w-5xl px-4 py-8 md:px-10">
    <PageHeader title={profile.name} back={{ href: list, label: 'All profiles' }}>
        {#snippet status()}
            <PhaseBadge phase={profile.phase} />
        {/snippet}
    </PageHeader>

    {#if profile.problems}
        <div class="mb-8 max-w-xl">
            <Alert tone="danger" title="What is wrong">{profile.problems}</Alert>
        </div>
    {/if}
    {#if profile.phase === 'Deleting'}
        <div class="mb-8 max-w-xl">
            <Alert tone="info">
                This profile is being deleted. It disappears from the list when it is gone.
            </Alert>
        </div>
    {/if}

    <SettingsSection
        title="Overview"
        description="A profile cannot be changed: to change one, make another and move your machines to it."
    >
        <dl class="grid grid-cols-[max-content_minmax(0,1fr)] gap-x-8 gap-y-3">
            <dt class="text-fg-3">vCPU</dt>
            <dd class="tnum">{profile.cpu}</dd>
            <dt class="text-fg-3">Memory</dt>
            <dd class="tnum">{Math.round((profile.memoryMiB / 1024) * 10) / 10} GiB</dd>
            <dt class="text-fg-3">Root disk</dt>
            <dd class="tnum">{profile.diskGiB} GiB</dd>
            {#if profile.description}
                <dt class="text-fg-3">Description</dt>
                <dd>{profile.description}</dd>
            {/if}
            {#if profile.builtin}
                <dt class="text-fg-3">Kind</dt>
                <dd>Built in: every tenant has it.</dd>
            {/if}
            {#if profile.createdAt}
                <dt class="text-fg-3">Created</dt>
                <dd>
                    <time datetime={profile.createdAt}
                        >{new Date(profile.createdAt).toLocaleString('en-GB', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                            timeZone: 'UTC'
                        })} UTC</time
                    >
                    {#if profile.createdBy}<span class="text-fg-2">by {profile.createdBy}</span
                        >{/if}
                </dd>
            {/if}
        </dl>
    </SettingsSection>

    <SettingsSection
        title="Virtual machines"
        description="The machines of this tenant that have this profile for their size."
    >
        {#if !instances}
            <p class="text-fg-3">The virtual machines of this tenant cannot be listed right now.</p>
        {:else if instances.length === 0}
            <p class="text-fg-3">No virtual machine has this profile.</p>
        {:else}
            <ul class="panel divide-y divide-line">
                {#each instances as instance (instance.name)}
                    <li
                        class="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3"
                    >
                        <a
                            href="/t/{data.tenant.name}/instances/{instance.name}"
                            class="font-mono font-semibold">{instance.name}</a
                        >
                        <InstanceStatus {instance} />
                    </li>
                {/each}
            </ul>
        {/if}
    </SettingsSection>

    {#if profile.builtin}
        <SettingsSection title="Delete this profile">
            <p class="max-w-xl">
                Every tenant has the three profiles <span class="font-mono">s</span>,
                <span class="font-mono">m</span> and <span class="font-mono">l</span>. They are part
                of the tenant: they cannot be changed or deleted.
            </p>
        </SettingsSection>
    {:else if profile.phase !== 'Deleting'}
        <SettingsSection
            title="Delete this profile"
            description="The profile is removed from the tenant."
        >
            <div class="max-w-xl">
                {#if form?.remove?.message}
                    <div class="mb-4">
                        <Alert tone="danger" title="The profile was not deleted"
                            >{form.remove.message}</Alert
                        >
                    </div>
                {/if}
                <ConfirmDelete
                    name={profile.name}
                    what="profile"
                    {consequence}
                    open={!!form?.remove?.message}
                />
            </div>
        </SettingsSection>
    {/if}
</main>
