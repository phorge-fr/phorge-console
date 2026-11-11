<script lang="ts">
    import Alert from '#lib/components/Alert.svelte';
    import AutoRefresh from '#lib/components/AutoRefresh.svelte';
    import ConfirmDelete from '#lib/components/ConfirmDelete.svelte';
    import PageHeader from '#lib/components/PageHeader.svelte';
    import PhaseBadge from '#lib/components/PhaseBadge.svelte';
    import SettingsSection from '#lib/components/SettingsSection.svelte';
    import { describeSecureBoot } from '#lib/profiles';

    let { data, form } = $props();

    const profile = $derived(data.profile);
    const list = $derived(`/t/${data.tenant.name}/profiles`);
    const instances = $derived(data.instances);
    // The page follows a profile that is being made or deleted.
    const notices = $derived(
        !!profile.problems || profile.phase === 'Provisioning' || profile.phase === 'Deleting'
    );
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

    <div class="mb-8 flex max-w-xl flex-col gap-3" hidden={!notices}>
        {#if profile.problems}
            <Alert tone="danger" title="What is wrong">{profile.problems}</Alert>
        {/if}
        {#if profile.phase === 'Provisioning'}
            <Alert tone="info">This profile is being made. This page follows it.</Alert>
        {:else if profile.phase === 'Deleting'}
            <Alert tone="info">
                This profile is being deleted. It disappears from the list when it is gone.
            </Alert>
        {/if}
    </div>

    <SettingsSection
        title="Overview"
        description="The size and the settings a virtual machine takes when it has this profile."
    >
        <dl class="grid grid-cols-[max-content_minmax(0,1fr)] gap-x-8 gap-y-3">
            <dt class="text-fg-3">vCPU</dt>
            <dd class="tnum">{profile.cpu}</dd>
            <dt class="text-fg-3">Memory</dt>
            <dd class="tnum">{Math.round((profile.memoryMiB / 1024) * 10) / 10} GiB</dd>
            <dt class="text-fg-3">Root disk</dt>
            <dd class="tnum">{profile.diskGiB} GiB</dd>
            <dt class="text-fg-3">Secure boot</dt>
            <dd>{describeSecureBoot(profile.secureBoot)}</dd>
            <dt class="text-fg-3">SSH keys</dt>
            <dd>
                {#if data.keys.length === 0}
                    <span class="text-fg-2">None</span>
                {:else}
                    <span class="tnum">{data.keys.length}</span>
                    <ul class="m-0 mt-1 flex list-none flex-col gap-2 p-0">
                        {#each data.keys as key, index (index)}
                            <li class="min-w-0 font-mono text-sm break-all">
                                {key.type}
                                <span class="text-fg-2">{key.fingerprint}</span>
                                {#if key.comment}<span class="text-fg-3">{key.comment}</span>{/if}
                            </li>
                        {/each}
                    </ul>
                {/if}
            </dd>
            {#if profile.description}
                <dt class="text-fg-3">Description</dt>
                <dd>{profile.description}</dd>
            {/if}
            {#if profile.builtin}
                <dt class="text-fg-3">Kind</dt>
                <dd>
                    Built in: every tenant has <span class="font-mono">s</span>,
                    <span class="font-mono">m</span> and <span class="font-mono">l</span>. This one
                    cannot be changed or deleted.
                </dd>
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
            <dt class="text-fg-3">Instances</dt>
            <dd>
                {#if instances === undefined}
                    <span class="text-fg-2"
                        >The instances of this tenant could not be listed. Reload the page to try
                        again.</span
                    >
                {:else}
                    {#each instances as instance (instance.name)}
                        <span class="block"
                            ><a
                                href="/t/{data.tenant.name}/instances/{instance.name}"
                                class="font-mono">{instance.name}</a
                            >
                            <span class="text-fg-3">{instance.phase}</span></span
                        >
                    {:else}
                        <span class="text-fg-2">No instance has this profile.</span>
                    {/each}
                {/if}
            </dd>
        </dl>
        <p class="mt-5 max-w-xl text-fg-2">
            A virtual machine that does not say its own secure boot or SSH keys takes the ones of
            its profile. One that says its own keeps it, and the keys it gives replace these, they
            do not add to them.
        </p>
    </SettingsSection>

    {#if !profile.builtin && profile.phase !== 'Deleting'}
        <SettingsSection
            title="Change this profile"
            description="A profile cannot be changed once it is made."
        >
            <p class="max-w-xl text-fg-2">
                To get another size, make a new profile and move your virtual machines to it from
                their pages.
            </p>
        </SettingsSection>

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
