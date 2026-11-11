<script lang="ts">
    import Plus from '@lucide/svelte/icons/plus';
    import Alert from '#lib/components/Alert.svelte';
    import AutoRefresh from '#lib/components/AutoRefresh.svelte';
    import EmptyState from '#lib/components/EmptyState.svelte';
    import PageHeader from '#lib/components/PageHeader.svelte';
    import PhaseBadge from '#lib/components/PhaseBadge.svelte';

    let { data } = $props();

    // A list that follows what is being deployed or deleted.
    const busy = $derived(
        data.networks.some(
            (network) => network.phase === 'Provisioning' || network.phase === 'Deleting'
        )
    );
    const base = $derived(`/t/${data.tenant.name}/networks`);
</script>

<svelte:head>
    <title>Networks · {data.tenant.displayName || data.tenant.name} · Phorge console</title>
</svelte:head>

<AutoRefresh active={busy} />

<main class="mx-auto w-full max-w-5xl px-4 py-8 md:px-10">
    <PageHeader
        title="Networks"
        subtitle="A private network for your virtual machines. They reach the Internet through it and cannot be reached from it. A virtual machine needs one."
    >
        {#snippet actions()}
            <a href="{base}/new" class="btn-primary">
                <Plus size={16} aria-hidden="true" />
                Create a network
            </a>
        {/snippet}
    </PageHeader>

    {#if data.deleted}
        <div class="mb-6">
            <Alert
                tone="info"
                title={data.deleted.gone ? 'Network deleted' : 'Deleting the network'}
            >
                {#if data.deleted.gone}
                    <span class="font-mono">{data.deleted.name}</span> is gone.
                {:else}
                    <span class="font-mono">{data.deleted.name}</span> is being deleted. This list follows
                    it until it is gone.
                {/if}
            </Alert>
        </div>
    {/if}

    {#if data.networks.length === 0}
        <EmptyState title="No network yet">
            <p>
                Create a network before your first virtual machine. It takes a few seconds to be
                deployed.
            </p>
        </EmptyState>
    {:else}
        <div class="panel overflow-hidden">
            <table class="w-full border-collapse text-left">
                <thead class="sr-only md:table-header-group md:not-sr-only">
                    <tr class="border-b border-line bg-surface text-sm text-fg-3">
                        <th scope="col" class="px-4 py-2.5 font-semibold">Network</th>
                        <th scope="col" class="px-4 py-2.5 font-semibold">Range</th>
                        <th scope="col" class="px-4 py-2.5 font-semibold">State</th>
                        <th scope="col" class="px-4 py-2.5 font-semibold">Created</th>
                    </tr>
                </thead>
                <tbody class="block md:table-row-group">
                    {#each data.networks as network (network.name)}
                        <tr
                            class="block border-b border-line px-4 py-3 align-top last:border-b-0 md:table-row md:px-0 md:py-0"
                        >
                            <td class="block py-0.5 md:table-cell md:px-4 md:py-3.5">
                                <a href="{base}/{network.name}" class="font-mono font-semibold"
                                    >{network.name}</a
                                >
                                {#if network.description}
                                    <span class="block text-sm text-fg-3"
                                        >{network.description}</span
                                    >
                                {/if}
                            </td>
                            <td class="block py-0.5 text-sm md:table-cell md:px-4 md:py-3.5">
                                {#if network.ipv4 || network.ipv6}
                                    {#if network.ipv4}<span class="block font-mono"
                                            >{network.ipv4}</span
                                        >{/if}
                                    {#if network.ipv6}<span class="block font-mono"
                                            >{network.ipv6}</span
                                        >{/if}
                                {:else}
                                    <span class="text-fg-3"
                                        ><span aria-hidden="true">—</span><span class="sr-only"
                                            >Not known yet</span
                                        ></span
                                    >
                                {/if}
                            </td>
                            <td class="block py-1 md:table-cell md:px-4 md:py-3.5">
                                <PhaseBadge phase={network.phase} />
                            </td>
                            <td
                                class="tnum block py-0.5 text-sm text-fg-2 md:table-cell md:px-4 md:py-3.5"
                            >
                                <time datetime={network.createdAt}
                                    >{new Date(network.createdAt).toLocaleDateString('en-GB', {
                                        dateStyle: 'medium',
                                        timeZone: 'UTC'
                                    })}</time
                                >
                            </td>
                        </tr>
                        {#if network.problems}
                            <tr
                                class="block border-b border-line px-4 pb-3 last:border-b-0 md:table-row md:p-0"
                            >
                                <td colspan="4" class="block md:table-cell md:px-4 md:pb-3.5">
                                    <Alert tone="danger" title="What is wrong"
                                        >{network.problems}</Alert
                                    >
                                </td>
                            </tr>
                        {/if}
                    {/each}
                </tbody>
            </table>
        </div>
    {/if}
</main>
