<script lang="ts">
    import AutoRefresh from '#lib/components/AutoRefresh.svelte';
    import EmptyState from '#lib/components/EmptyState.svelte';
    import PhaseBadge from '#lib/components/PhaseBadge.svelte';
    import { PLANS } from '#lib/plans';

    let { data } = $props();

    // A tenant that is being made or deleted changes by itself: the list follows.
    const inProgress = $derived(
        data.tenants.some((t) => t.phase === 'Provisioning' || t.phase === 'Deleting')
    );
</script>

<AutoRefresh active={inProgress} />

<svelte:head>
    <title>Tenants · Phorge console</title>
</svelte:head>

<main class="mx-auto max-w-6xl px-4 py-8">
    <div class="flex flex-wrap items-center justify-between gap-4">
        <h1 class="text-3xl font-bold">Your tenants</h1>
        {#if data.platformAdmin}
            <a
                href="/new"
                class="inline-block rounded bg-primary px-5 py-2 font-semibold text-on-primary no-underline"
                >New tenant</a
            >
        {/if}
    </div>

    {#if data.tenants.length === 0}
        <div class="mt-8">
            <EmptyState title="You have no tenant yet">
                <p>
                    A tenant is a space with its own quota, images, virtual machines and members. A
                    platform administrator creates it and gives you a role on it.
                </p>
            </EmptyState>
        </div>
    {:else}
        <ul class="mt-6 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {#each data.tenants as tenant (tenant.name)}
                <li class="rounded border border-accent bg-surface p-5">
                    <h2 class="text-xl font-semibold">
                        <a href="/t/{tenant.name}">{tenant.displayName || tenant.name}</a>
                    </h2>
                    {#if tenant.displayName}
                        <p class="font-mono text-sm text-muted">{tenant.name}</p>
                    {/if}
                    <p class="mt-3"><PhaseBadge phase={tenant.phase} /></p>
                    <p class="mt-3 text-muted">
                        Plan <strong class="text-fg">{tenant.plan}</strong>: up to {PLANS[
                            tenant.plan
                        ]?.instances} VM, {PLANS[tenant.plan]?.vcpu} vCPU
                    </p>
                </li>
            {/each}
        </ul>
    {/if}
</main>
