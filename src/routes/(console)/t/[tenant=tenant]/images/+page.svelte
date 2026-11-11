<script lang="ts">
    import Plus from '@lucide/svelte/icons/plus';
    import Alert from '#lib/components/Alert.svelte';
    import AutoRefresh from '#lib/components/AutoRefresh.svelte';
    import EmptyState from '#lib/components/EmptyState.svelte';
    import PageHeader from '#lib/components/PageHeader.svelte';
    import PhaseBadge from '#lib/components/PhaseBadge.svelte';

    let { data } = $props();

    // A list that follows what is being pulled or deleted.
    const busy = $derived(
        data.images.some((image) => image.phase === 'Provisioning' || image.phase === 'Deleting')
    );
    const base = $derived(`/t/${data.tenant.name}/images`);
</script>

<svelte:head>
    <title>Images · {data.tenant.displayName || data.tenant.name} · Phorge console</title>
</svelte:head>

<AutoRefresh active={busy} />

<main class="mx-auto w-full max-w-5xl px-4 py-8 md:px-10">
    <PageHeader
        title="Images"
        subtitle="The operating systems your virtual machines start from. An image is pulled once from linuxcontainers.org and cannot be changed: to update it, delete it and pull it again."
    >
        {#snippet actions()}
            <a href="{base}/new" class="btn-primary">
                <Plus size={16} aria-hidden="true" />
                Pull an image
            </a>
        {/snippet}
    </PageHeader>

    {#if data.deleted}
        <div class="mb-6">
            <Alert tone="info" title={data.deleted.gone ? 'Image deleted' : 'Deleting the image'}>
                {#if data.deleted.gone}
                    <span class="font-mono">{data.deleted.name}</span> is gone.
                {:else}
                    <span class="font-mono">{data.deleted.name}</span> is being deleted. This list follows
                    it until it is gone.
                {/if}
            </Alert>
        </div>
    {/if}

    {#if data.images.length === 0}
        <EmptyState title="No image yet">
            <p>
                An image is the system a virtual machine starts from. It takes a few minutes to be
                pulled.
            </p>
        </EmptyState>
    {:else}
        <div class="panel overflow-hidden">
            <table class="w-full border-collapse text-left">
                <thead class="sr-only md:table-header-group md:not-sr-only">
                    <tr class="border-b border-line bg-surface text-sm text-fg-3">
                        <th scope="col" class="px-4 py-2.5 font-semibold">Image</th>
                        <th scope="col" class="px-4 py-2.5 font-semibold">State</th>
                        <th scope="col" class="px-4 py-2.5 font-semibold">Source</th>
                        <th scope="col" class="px-4 py-2.5 font-semibold">Pulled</th>
                    </tr>
                </thead>
                <tbody class="block md:table-row-group">
                    {#each data.images as image (image.name)}
                        <tr
                            class="relative block border-b border-line px-4 py-3 align-top last:border-b-0 hover:bg-surface md:table-row md:px-0 md:py-0"
                        >
                            <td class="block py-0.5 md:table-cell md:px-4 md:py-3.5">
                                <a
                                    href="{base}/{image.name}"
                                    class="font-mono font-semibold text-fg no-underline after:absolute after:inset-0 after:content-['']"
                                    >{image.name}</a
                                >
                                {#if image.aliases.length}
                                    <span class="block text-sm text-fg-3">
                                        Also known as {image.aliases.join(', ')}
                                    </span>
                                {/if}
                            </td>
                            <td class="block py-1 md:table-cell md:px-4 md:py-3.5">
                                <PhaseBadge phase={image.phase} />
                            </td>
                            <td
                                class="block py-0.5 font-mono text-sm break-all text-fg-2 md:table-cell md:px-4 md:py-3.5"
                            >
                                {image.source.remote ?? 'images'}:{image.source.name}
                            </td>
                            <td
                                class="tnum block py-0.5 text-sm text-fg-2 md:table-cell md:px-4 md:py-3.5"
                            >
                                <time datetime={image.createdAt}
                                    >{new Date(image.createdAt).toLocaleDateString('en-GB', {
                                        dateStyle: 'medium',
                                        timeZone: 'UTC'
                                    })}</time
                                >
                            </td>
                        </tr>
                        {#if image.problems}
                            <tr
                                class="block border-b border-line px-4 pb-3 last:border-b-0 md:table-row md:p-0"
                            >
                                <td colspan="4" class="block md:table-cell md:px-4 md:pb-3.5">
                                    <Alert tone="danger" title="What is wrong"
                                        >{image.problems}</Alert
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
