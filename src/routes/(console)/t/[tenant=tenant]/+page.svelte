<script lang="ts">
    import Alert from '#lib/components/Alert.svelte';
    import ConfirmDelete from '#lib/components/ConfirmDelete.svelte';
    import Meter from '#lib/components/Meter.svelte';
    import PageHeader from '#lib/components/PageHeader.svelte';
    import PhaseBadge from '#lib/components/PhaseBadge.svelte';
    import PlanPicker from '#lib/components/PlanPicker.svelte';
    import SettingsSection from '#lib/components/SettingsSection.svelte';
    import { PLANS } from '#lib/plans';

    let { data, form } = $props();

    const id = $props.id();
    const tenant = $derived(data.tenant);
    // What the tenant really has, from its quota; the description of the plan stands in when the quota cannot be read.
    const plan = $derived(
        data.quota
            ? {
                  instances: data.quota.limits.instances,
                  vcpu: data.quota.limits.vcpu,
                  memoryGiB: data.quota.limits.memoryMiB / 1024,
                  diskGiB: data.quota.limits.diskGiB
              }
            : PLANS[tenant.plan]
    );
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

    <SettingsSection title="Usage" description="What this tenant holds of what its plan allows.">
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
            </div>
            <p class="help mt-5">
                Stopped machines count. <a href="/t/{tenant.name}/instances">See the instances</a>
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
            <dt class="text-fg-3">Plan</dt>
            <dd class="tnum">
                <span class="font-semibold capitalize">{tenant.plan}</span>
                <span class="text-fg-2">
                    · {plan.instances}
                    {plan.instances === 1 ? 'VM' : 'VMs'} · {plan.vcpu} vCPU · {plan.memoryGiB} GiB of
                    memory · {plan.diskGiB} GiB of disk
                </span>
            </dd>
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

    {#if data.platformAdmin}
        {#if tenant.phase === 'Deleting'}
            <SettingsSection title="Administration">
                <Alert tone="info">
                    This tenant is being deleted. This page follows it until it is gone.
                </Alert>
            </SettingsSection>
        {:else}
            <SettingsSection
                title="Plan and name"
                description="For platform administrators. The plan is applied within a minute."
            >
                <form method="POST" action="?/update" class="flex max-w-xl flex-col gap-5">
                    {#if form?.update?.message}
                        <Alert tone="danger">{form.update.message}</Alert>
                    {:else if form?.update?.saved}
                        <Alert tone="info">Saved. The new plan is applied within a minute.</Alert>
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
                    <PlanPicker selected={tenant.plan} />
                    <div><button type="submit" class="btn-primary">Save</button></div>
                </form>
            </SettingsSection>

            <SettingsSection title="Delete this tenant" description="For platform administrators.">
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
    {/if}
</main>
