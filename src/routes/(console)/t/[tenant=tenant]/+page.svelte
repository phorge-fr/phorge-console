<script lang="ts">
    import PhaseBadge from '#lib/components/PhaseBadge.svelte';
    import { PLANS } from '#lib/plans';

    let { data } = $props();
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
</main>
