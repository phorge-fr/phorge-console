<script lang="ts">
    import Plus from '@lucide/svelte/icons/plus';
    import Alert from '#lib/components/Alert.svelte';
    import AutoRefresh from '#lib/components/AutoRefresh.svelte';
    import ConfirmDelete from '#lib/components/ConfirmDelete.svelte';
    import EmptyState from '#lib/components/EmptyState.svelte';
    import PageHeader from '#lib/components/PageHeader.svelte';
    import PhaseBadge from '#lib/components/PhaseBadge.svelte';
    import SettingsSection from '#lib/components/SettingsSection.svelte';
    import { IMAGE_NAME_PATTERN, MAX_ALIASES } from '#lib/images';

    let { data, form } = $props();

    const id = $props.id();
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
            <a href="#pull" class="btn-primary">
                <Plus size={16} aria-hidden="true" />
                Pull an image
            </a>
        {/snippet}
    </PageHeader>

    {#if form?.remove?.message}
        <div class="mb-6">
            <Alert tone="danger" title="The image {form.remove.image} was not deleted">
                {form.remove.message}
            </Alert>
        </div>
    {/if}

    {#if data.confirm}
        <div class="mb-6">
            <ConfirmDelete
                open
                name={data.confirm}
                what="image"
                consequence="Virtual machines cannot be started from it any more. The deletion is refused while a virtual machine still starts from it. You can pull it again later."
                action="?/delete&image={encodeURIComponent(data.confirm)}"
            />
            <p class="mt-2 text-sm"><a href={base}>Cancel</a></p>
        </div>
    {/if}

    {#if data.images.length === 0}
        <EmptyState title="No image yet">
            <p>
                An image is the system a virtual machine starts from. It takes a few minutes to be
                pulled.
            </p>
            {#snippet action()}
                <a href="#pull" class="btn-primary">Pull an image</a>
            {/snippet}
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
                        <th scope="col" class="px-4 py-2.5"><span class="sr-only">Actions</span></th
                        >
                    </tr>
                </thead>
                <tbody class="block md:table-row-group">
                    {#each data.images as image (image.name)}
                        <tr
                            class="block border-b border-line px-4 py-3 align-top last:border-b-0 md:table-row md:px-0 md:py-0"
                        >
                            <td class="block py-0.5 md:table-cell md:px-4 md:py-3.5">
                                <span class="font-mono font-semibold">{image.name}</span>
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
                            <td class="block py-1 md:table-cell md:px-4 md:py-3.5 md:text-right">
                                {#if image.phase !== 'Deleting'}
                                    <a
                                        href="{base}?delete={encodeURIComponent(image.name)}"
                                        class="text-sm font-semibold text-fg-2 hover:text-bad-fg"
                                        >Delete<span class="sr-only"> {image.name}</span></a
                                    >
                                {/if}
                            </td>
                        </tr>
                        {#if image.problems}
                            <tr
                                class="block border-b border-line px-4 pb-3 last:border-b-0 md:table-row md:p-0"
                            >
                                <td colspan="5" class="block md:table-cell md:px-4 md:pb-3.5">
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

    <div class="mt-12" id="pull">
        <SettingsSection
            title="Pull an image"
            description="From the public image server. The name is what your virtual machines start from."
        >
            {#if form?.create?.message}
                <div class="mb-5 max-w-xl"><Alert tone="danger">{form.create.message}</Alert></div>
            {/if}
            <form method="POST" action="?/create" class="flex max-w-xl flex-col gap-5">
                <div class="flex flex-col gap-1.5">
                    <label for="{id}-name" class="field-label">Name</label>
                    <input
                        id="{id}-name"
                        name="name"
                        required
                        maxlength="63"
                        pattern={IMAGE_NAME_PATTERN}
                        value={form?.create?.values?.name ?? ''}
                        autocomplete="off"
                        autocapitalize="off"
                        spellcheck="false"
                        placeholder="debian"
                        class="field max-w-sm font-mono"
                        aria-describedby="{id}-name-help"
                    />
                    <p id="{id}-name-help" class="help">
                        Lowercase letters, digits and hyphens. It cannot change.
                    </p>
                </div>

                <div class="flex flex-col gap-1.5">
                    <label for="{id}-source" class="field-label">Source</label>
                    <input
                        id="{id}-source"
                        name="source"
                        required
                        maxlength="200"
                        value={form?.create?.values?.source ?? ''}
                        autocomplete="off"
                        autocapitalize="off"
                        spellcheck="false"
                        placeholder="debian/13/cloud"
                        class="field font-mono"
                        aria-describedby="{id}-source-help"
                    />
                    <p id="{id}-source-help" class="help">
                        The name of the image on linuxcontainers.org. Choose a <code
                            class="font-mono">cloud</code
                        > variant to use SSH keys. An image that does not exist there never becomes ready.
                    </p>
                </div>

                <div class="flex flex-col gap-1.5">
                    <label for="{id}-aliases" class="field-label">
                        Aliases <span class="font-normal text-fg-3">(optional)</span>
                    </label>
                    <input
                        id="{id}-aliases"
                        name="aliases"
                        value={form?.create?.values?.aliases ?? ''}
                        autocomplete="off"
                        autocapitalize="off"
                        spellcheck="false"
                        class="field font-mono"
                        aria-describedby="{id}-aliases-help"
                    />
                    <p id="{id}-aliases-help" class="help">
                        Other names for the image, separated by spaces or commas. {MAX_ALIASES} at most.
                    </p>
                </div>

                <div><button type="submit" class="btn-primary">Pull the image</button></div>
            </form>
        </SettingsSection>
    </div>
</main>
