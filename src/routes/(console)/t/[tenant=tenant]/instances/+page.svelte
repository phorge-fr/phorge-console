<script lang="ts">
    import Plus from '@lucide/svelte/icons/plus';
    import Alert from '#lib/components/Alert.svelte';
    import AutoRefresh from '#lib/components/AutoRefresh.svelte';
    import EmptyState from '#lib/components/EmptyState.svelte';
    import PageHeader from '#lib/components/PageHeader.svelte';
    import InstanceStatus from '#lib/components/InstanceStatus.svelte';

    let { data } = $props();

    const base = $derived(`/t/${data.tenant.name}/instances`);
    // A list that follows what is being made, started, stopped or deleted.
    const busy = $derived(
        data.instances.some(
            (instance) =>
                instance.phase === 'Provisioning' ||
                instance.phase === 'Deleting' ||
                instance.transition
        )
    );
</script>

<svelte:head>
    <title>Instances · {data.tenant.displayName || data.tenant.name} · Phorge console</title>
</svelte:head>

<AutoRefresh active={busy} />

<main class="mx-auto w-full max-w-5xl px-4 py-8 md:px-10">
    <PageHeader
        title="Instances"
        subtitle="The virtual machines of this tenant, each with its own disk."
    >
        {#snippet actions()}
            <a href="{base}/new" class="btn-primary">
                <Plus size={16} aria-hidden="true" />
                Create an instance
            </a>
        {/snippet}
    </PageHeader>

    {#if data.instances.length === 0}
        <EmptyState title="No instance yet">
            <p>Create a virtual machine from one of your images. It is ready in about a minute.</p>
        </EmptyState>
    {:else}
        <div class="panel overflow-hidden">
            <table class="w-full border-collapse text-left">
                <thead class="sr-only md:table-header-group md:not-sr-only">
                    <tr class="border-b border-line bg-surface text-sm text-fg-3">
                        <th scope="col" class="px-4 py-2.5 font-semibold">Name</th>
                        <th scope="col" class="px-4 py-2.5 font-semibold">State</th>
                        <th scope="col" class="px-4 py-2.5 font-semibold">Image</th>
                        <th scope="col" class="px-4 py-2.5 font-semibold">Size</th>
                        <th scope="col" class="px-4 py-2.5 font-semibold">Address</th>
                    </tr>
                </thead>
                <tbody class="block md:table-row-group">
                    {#each data.instances as instance (instance.name)}
                        <tr
                            class="relative block border-b border-line px-4 py-3 last:border-b-0 hover:bg-surface md:table-row md:px-0 md:py-0"
                        >
                            <td class="block py-0.5 md:table-cell md:px-4 md:py-3.5">
                                <a
                                    href="{base}/{instance.name}"
                                    class="font-mono font-semibold text-fg no-underline after:absolute after:inset-0 after:content-['']"
                                    >{instance.name}</a
                                >
                            </td>
                            <td class="block py-1 md:table-cell md:px-4 md:py-3.5">
                                <InstanceStatus {instance} />
                            </td>
                            <td
                                class="block py-0.5 font-mono text-sm text-fg-2 md:table-cell md:px-4 md:py-3.5"
                            >
                                {instance.image}
                            </td>
                            <td
                                class="tnum block py-0.5 text-sm text-fg-2 md:table-cell md:px-4 md:py-3.5"
                            >
                                {instance.cpu} vCPU · {instance.memoryMiB / 1024} GiB · {instance.diskGiB}
                                GiB
                            </td>
                            <td
                                class="block py-0.5 font-mono text-sm text-fg-2 md:table-cell md:px-4 md:py-3.5"
                            >
                                {instance.ipv4 ?? '—'}
                            </td>
                        </tr>
                        {#if instance.problems}
                            <tr
                                class="block border-b border-line px-4 pb-3 last:border-b-0 md:table-row md:p-0"
                            >
                                <td colspan="5" class="block md:table-cell md:px-4 md:pb-3.5">
                                    <Alert tone="danger" title="What is wrong"
                                        >{instance.problems}</Alert
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
