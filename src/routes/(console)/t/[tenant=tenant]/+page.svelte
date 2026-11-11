<script lang="ts">
    import Alert from '#lib/components/Alert.svelte';
    import ConfirmDelete from '#lib/components/ConfirmDelete.svelte';
    import Meter from '#lib/components/Meter.svelte';
    import PageHeader from '#lib/components/PageHeader.svelte';
    import PhaseBadge from '#lib/components/PhaseBadge.svelte';
    import SettingsSection from '#lib/components/SettingsSection.svelte';

    let { data, form } = $props();

    const id = $props.id();
    const tenant = $derived(data.tenant);
</script>

<svelte:head>
    <title>{tenant.displayName || tenant.name} · Phorge console</title>
</svelte:head>

<main class="mx-auto w-full max-w-5xl px-4 py-8 md:px-10">
    <PageHeader
        title={tenant.displayName || tenant.name}
        subtitle={tenant.displayName ? tenant.name : undefined}
        back={{ href: '/', label: 'All tenants' }}
    >
        {#snippet status()}
            <PhaseBadge phase={tenant.phase} />
        {/snippet}
    </PageHeader>

    {#if tenant.problems}
        <div class="mb-8">
            <Alert tone="danger" title="What is wrong">{tenant.problems}</Alert>
        </div>
    {/if}

    <SettingsSection
        title="Usage"
        description="What this tenant holds of what every tenant may hold."
    >
        {#if data.quota}
            {@const used = data.quota.used}
            {@const limits = data.quota.limits}
            <div class="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                <Meter label="Virtual machines" used={used.instances} total={limits.instances} />
                <Meter label="vCPU" used={used.vcpu} total={limits.vcpu} />
                <Meter
                    label="Memory"
                    used={used.memoryMiB / 1024}
                    total={limits.memoryMiB / 1024}
                    unit="GiB"
                />
                <Meter label="Disk" used={used.diskGiB} total={limits.diskGiB} unit="GiB" />
                <Meter label="Networks" used={used.networks} total={limits.networks} />
                <Meter label="Profiles" used={used.profiles} total={limits.profiles} />
            </div>
            <p class="help mt-5">
                Stopped machines count. The profiles <span class="font-mono">s</span>,
                <span class="font-mono">m</span> and <span class="font-mono">l</span> do not.
                <a href="/t/{tenant.name}/instances">See the instances</a>
            </p>
        {:else}
            <Alert tone="warning"
                >The usage cannot be read right now. Reload the page to try again.</Alert
            >
        {/if}
    </SettingsSection>

    <SettingsSection title="Details">
        <dl class="grid grid-cols-[max-content_minmax(0,1fr)] gap-x-8 gap-y-3">
            <dt class="text-fg-3">Owner</dt>
            <dd class="break-words">{tenant.owner}</dd>
            {#if tenant.createdAt}
                <dt class="text-fg-3">Created</dt>
                <dd>
                    <time datetime={tenant.createdAt}
                        >{new Date(tenant.createdAt).toLocaleString('en-GB', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                            timeZone: 'UTC'
                        })} UTC</time
                    >
                    {#if tenant.createdBy}<span class="text-fg-2">by {tenant.createdBy}</span>{/if}
                </dd>
            {/if}
        </dl>
    </SettingsSection>

    {#if tenant.phase === 'Deleting'}
        <SettingsSection title="Administration">
            <Alert tone="info">
                This tenant is being deleted. This page follows it until it is gone.
            </Alert>
        </SettingsSection>
    {:else}
        <SettingsSection
            title="Name"
            description="What the tenant is called in the console. The administrators of the tenant change it."
        >
            <form method="POST" action="?/update" class="flex max-w-xl flex-col gap-5">
                {#if form?.update?.message}
                    <Alert tone="danger">{form.update.message}</Alert>
                {:else if form?.update?.saved}
                    <Alert tone="info">Saved.</Alert>
                {/if}
                <div class="flex flex-col gap-1.5">
                    <label for="{id}-display" class="field-label">Display name</label>
                    <input
                        id="{id}-display"
                        name="displayName"
                        maxlength="100"
                        value={tenant.displayName ?? ''}
                        class="field"
                    />
                </div>
                <div><button type="submit" class="btn-primary">Save</button></div>
            </form>
        </SettingsSection>

        <SettingsSection
            title="Delete this tenant"
            description="For the administrators of the tenant, its owner included."
        >
            <div class="max-w-xl">
                {#if form?.remove?.message}
                    <div class="mb-4"><Alert tone="danger">{form.remove.message}</Alert></div>
                {/if}
                <ConfirmDelete
                    name={tenant.name}
                    what="tenant"
                    consequence="It destroys the virtual machines of the tenant, and its images and its members with them."
                    action="?/delete"
                />
            </div>
        </SettingsSection>
    {/if}
</main>
