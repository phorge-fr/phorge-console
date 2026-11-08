<script lang="ts">
    import ChevronRight from '@lucide/svelte/icons/chevron-right';
    import Plus from '@lucide/svelte/icons/plus';
    import AutoRefresh from '#lib/components/AutoRefresh.svelte';
    import EmptyState from '#lib/components/EmptyState.svelte';
    import PageHeader from '#lib/components/PageHeader.svelte';
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

<main class="mx-auto w-full max-w-5xl px-4 py-8 md:px-10">
    <PageHeader
        title="Tenants"
        subtitle="A tenant is a space with its own quota, images, virtual machines and members."
    >
        {#snippet actions()}
            {#if data.canCreateTenants}
                <a href="/new" class="btn-primary">
                    <Plus size={16} aria-hidden="true" />
                    New tenant
                </a>
            {/if}
        {/snippet}
    </PageHeader>

    {#if data.tenants.length === 0}
        <EmptyState title="You are not in a tenant yet">
            {#if data.canCreateTenants}
                <p>
                    A tenant is your own space: create one to pull images and start virtual
                    machines.
                </p>
            {:else}
                <p>Somebody has to give you a role on a tenant. It then shows up here.</p>
            {/if}
        </EmptyState>
    {:else}
        <div class="panel overflow-hidden">
            <table class="w-full border-collapse text-left">
                <thead class="sr-only md:table-header-group md:not-sr-only">
                    <tr class="border-b border-line bg-surface text-sm text-fg-3">
                        <th scope="col" class="px-4 py-2.5 font-semibold">Name</th>
                        <th scope="col" class="px-4 py-2.5 font-semibold">State</th>
                        <th scope="col" class="px-4 py-2.5 font-semibold">Plan</th>
                        <th scope="col" class="w-10 px-4 py-2.5"
                            ><span class="sr-only">Open</span></th
                        >
                    </tr>
                </thead>
                <tbody class="block md:table-row-group">
                    {#each data.tenants as tenant (tenant.name)}
                        {@const plan = PLANS[tenant.plan]}
                        <tr
                            class="relative block border-b border-line px-4 py-3 last:border-b-0 hover:bg-surface md:table-row md:px-0 md:py-0"
                        >
                            <td class="block py-0.5 md:table-cell md:px-4 md:py-3.5">
                                <a
                                    href="/t/{tenant.name}"
                                    class="font-semibold text-fg no-underline after:absolute after:inset-0 after:content-['']"
                                    >{tenant.displayName || tenant.name}</a
                                >
                                {#if tenant.displayName}
                                    <span class="block font-mono text-sm text-fg-3"
                                        >{tenant.name}</span
                                    >
                                {/if}
                            </td>
                            <td class="block py-1 md:table-cell md:px-4 md:py-3.5">
                                <PhaseBadge phase={tenant.phase} />
                            </td>
                            <td class="tnum block py-0.5 text-fg-2 md:table-cell md:px-4 md:py-3.5">
                                <span class="font-semibold capitalize text-fg">{tenant.plan}</span>
                                {#if plan}
                                    <span class="text-fg-3">
                                        · {plan.instances}
                                        VMs · {plan.vcpu} vCPU · {plan.memoryGiB}
                                        GiB
                                    </span>
                                {/if}
                            </td>
                            <td class="hidden px-4 py-3.5 text-right md:table-cell">
                                <ChevronRight
                                    size={18}
                                    class="inline text-fg-3"
                                    aria-hidden="true"
                                />
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    {/if}
</main>
