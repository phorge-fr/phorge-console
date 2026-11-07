<script lang="ts">
    import ConfirmDelete from '#lib/components/ConfirmDelete.svelte';
    import PhaseBadge from '#lib/components/PhaseBadge.svelte';
    import { PLANS } from '#lib/plans';

    let { data, form } = $props();

    const id = $props.id();
    const plan = $derived(PLANS[data.tenant.plan]);
</script>

<svelte:head>
    <title>{data.tenant.displayName || data.tenant.name} · Phorge console</title>
</svelte:head>

<main class="mx-auto max-w-6xl px-4 py-8">
    <h1 class="text-3xl font-bold">{data.tenant.displayName || data.tenant.name}</h1>
    {#if data.tenant.displayName}
        <p class="font-mono text-muted">{data.tenant.name}</p>
    {/if}

    <p class="mt-4"><PhaseBadge phase={data.tenant.phase} /></p>
    {#if data.tenant.problems}
        <p role="alert" class="mt-4 rounded border-2 border-fg bg-surface p-4">
            <strong>What is wrong:</strong>
            {data.tenant.problems}
        </p>
    {/if}

    <dl class="mt-8 grid grid-cols-[max-content_1fr] gap-x-6 gap-y-3">
        <dt class="text-muted">Owner</dt>
        <dd>{data.tenant.owner}</dd>
        <dt class="text-muted">Plan</dt>
        <dd>
            <strong>{data.tenant.plan}</strong>: {plan.instances} VM, {plan.vcpu} vCPU, {plan.memoryGiB}
            GiB of memory, {plan.diskGiB} GiB of disk, {plan.networks}
            {plan.networks === 1 ? 'network' : 'networks'}
        </dd>
        {#if data.tenant.createdAt}
            <dt class="text-muted">Created</dt>
            <dd>
                <time datetime={data.tenant.createdAt}
                    >{new Date(data.tenant.createdAt).toLocaleString('en-GB', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                        timeZone: 'UTC'
                    })} UTC</time
                >
                {#if data.tenant.createdBy}by {data.tenant.createdBy}{/if}
            </dd>
        {/if}
    </dl>
    {#if data.platformAdmin}
        <section class="mt-12 border-t border-accent pt-8" aria-labelledby="{id}-admin">
            <h2 id="{id}-admin" class="text-2xl font-bold">Administration</h2>
            <p class="mt-2 text-muted">For platform administrators.</p>

            {#if data.tenant.phase === 'Deleting'}
                <p class="mt-6">
                    This tenant is being deleted. This page follows it until it is gone.
                </p>
            {:else}
                <form method="POST" action="?/update" class="mt-6 flex max-w-xl flex-col gap-4">
                    {#if form?.update?.message}
                        <p role="alert" class="rounded border-2 border-fg bg-surface p-4">
                            {form.update.message}
                        </p>
                    {:else if form?.update?.saved}
                        <p role="status" class="rounded border border-accent bg-surface p-4">
                            Saved. The new plan is applied within a minute.
                        </p>
                    {/if}
                    <div class="flex flex-col gap-1">
                        <label for="{id}-display" class="font-semibold">Display name</label>
                        <input
                            id="{id}-display"
                            name="displayName"
                            maxlength="100"
                            value={data.tenant.displayName ?? ''}
                            class="rounded border border-accent bg-bg px-3 py-2 text-fg"
                        />
                    </div>
                    <fieldset class="flex flex-col gap-2 border-0 p-0">
                        <legend class="font-semibold">Plan</legend>
                        {#each Object.entries(PLANS) as [plan, quota] (plan)}
                            <label
                                class="flex items-start gap-3 rounded border border-accent bg-surface p-3"
                            >
                                <input
                                    type="radio"
                                    name="plan"
                                    value={plan}
                                    required
                                    checked={data.tenant.plan === plan}
                                    class="mt-1"
                                />
                                <span>
                                    <strong>{plan}</strong>
                                    <span class="block text-muted">
                                        {quota.instances}
                                        {quota.instances === 1 ? 'VM' : 'VMs'}, {quota.vcpu} vCPU, {quota.memoryGiB}
                                        GiB of memory, {quota.diskGiB} GiB of disk
                                    </span>
                                </span>
                            </label>
                        {/each}
                    </fieldset>
                    <div>
                        <button
                            type="submit"
                            class="cursor-pointer rounded bg-primary px-5 py-2 font-semibold text-on-primary"
                            >Save</button
                        >
                    </div>
                </form>

                <div class="mt-10 max-w-xl">
                    {#if form?.remove?.message}
                        <p role="alert" class="mb-4 rounded border-2 border-fg bg-surface p-4">
                            {form.remove.message}
                        </p>
                    {/if}
                    <ConfirmDelete
                        name={data.tenant.name}
                        what="tenant"
                        consequence="It destroys the virtual machines of the tenant, and its images and its members with them."
                        action="?/delete"
                    />
                </div>
            {/if}
        </section>
    {/if}
</main>
