<script lang="ts">
    import AutoRefresh from '#lib/components/AutoRefresh.svelte';
    import ConfirmDelete from '#lib/components/ConfirmDelete.svelte';
    import EmptyState from '#lib/components/EmptyState.svelte';
    import PhaseBadge from '#lib/components/PhaseBadge.svelte';
    import { IMAGE_NAME_PATTERN, MAX_ALIASES } from '#lib/images';

    let { data, form } = $props();

    const id = $props.id();
    const field = 'rounded border border-accent bg-bg px-3 py-2 text-fg';
    // A list that follows what is being pulled or deleted.
    const busy = $derived(
        data.images.some((image) => image.phase === 'Provisioning' || image.phase === 'Deleting')
    );
</script>

<svelte:head>
    <title>Images · {data.tenant.displayName || data.tenant.name} · Phorge console</title>
</svelte:head>

<AutoRefresh active={busy} />

<main class="mx-auto max-w-6xl px-4 py-8">
    <h1 class="text-3xl font-bold">Images</h1>
    <p class="mt-3 max-w-3xl text-muted">
        A virtual machine of this tenant starts from one of its images. An image is pulled once from
        the public image server (<a href="https://images.linuxcontainers.org">linuxcontainers.org</a
        >) and cannot be changed: to update it, delete it and pull it again. Pulling and deleting
        are for operators and administrators of the tenant.
    </p>

    {#if form?.remove?.message}
        <p role="alert" class="mt-6 rounded border-2 border-fg bg-surface p-4">
            <strong>{form.remove.image}:</strong>
            {form.remove.message}
        </p>
    {/if}

    <section class="mt-8" aria-labelledby="{id}-list">
        <h2 id="{id}-list" class="sr-only">The images</h2>
        {#if data.images.length === 0}
            <EmptyState title="No image yet">
                Pull one below to start a virtual machine from it. A virtual machine image takes a
                few minutes to be pulled.
            </EmptyState>
        {:else}
            <ul class="flex flex-col gap-4">
                {#each data.images as image (image.name)}
                    <li class="rounded border border-accent bg-surface p-4">
                        <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
                            <h3 class="font-mono text-lg font-bold">{image.name}</h3>
                            <PhaseBadge phase={image.phase} />
                        </div>
                        <dl class="mt-3 grid grid-cols-[max-content_1fr] gap-x-6 gap-y-1">
                            <dt class="text-muted">Source</dt>
                            <dd class="font-mono break-all">
                                {image.source.remote ?? 'images'}:{image.source.name}
                            </dd>
                            {#if image.aliases.length}
                                <dt class="text-muted">Aliases</dt>
                                <dd class="font-mono">{image.aliases.join(', ')}</dd>
                            {/if}
                            {#if image.fingerprint}
                                <dt class="text-muted">Fingerprint</dt>
                                <dd class="font-mono" title={image.fingerprint}>
                                    {image.fingerprint.slice(0, 12)}
                                </dd>
                            {/if}
                            <dt class="text-muted">Pulled</dt>
                            <dd>
                                <time datetime={image.createdAt}
                                    >{new Date(image.createdAt).toLocaleString('en-GB', {
                                        dateStyle: 'medium',
                                        timeStyle: 'short',
                                        timeZone: 'UTC'
                                    })} UTC</time
                                >
                                {#if image.createdBy}by {image.createdBy}{/if}
                            </dd>
                        </dl>
                        {#if image.problems}
                            <p role="alert" class="mt-3 rounded border-2 border-fg bg-bg p-3">
                                <strong>What is wrong:</strong>
                                {image.problems}
                            </p>
                        {/if}
                        {#if image.phase === 'Deleting'}
                            <p class="mt-3 text-muted">
                                This image is being deleted. This list follows it until it is gone.
                            </p>
                        {:else}
                            <div class="mt-4">
                                <ConfirmDelete
                                    name={image.name}
                                    what="image"
                                    consequence="Virtual machines cannot be started from it any more. It stays refused while a virtual machine still starts from it. You can pull it again later."
                                    action="?/delete&image={encodeURIComponent(image.name)}"
                                />
                            </div>
                        {/if}
                    </li>
                {/each}
            </ul>
        {/if}
    </section>

    <section class="mt-12 border-t border-accent pt-8" aria-labelledby="{id}-pull">
        <h2 id="{id}-pull" class="text-2xl font-bold">Pull an image</h2>

        {#if form?.create?.message}
            <p role="alert" class="mt-4 max-w-xl rounded border-2 border-fg bg-surface p-4">
                {form.create.message}
            </p>
        {/if}

        <form method="POST" action="?/create" class="mt-4 flex max-w-xl flex-col gap-5">
            <div class="flex flex-col gap-1">
                <label for="{id}-name" class="font-semibold">Name</label>
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
                    class="{field} max-w-sm font-mono"
                    aria-describedby="{id}-name-help"
                />
                <p id="{id}-name-help" class="text-sm text-muted">
                    What virtual machines start from, like <code class="font-mono">debian</code>.
                    Lowercase letters, digits and hyphens; it cannot change.
                </p>
            </div>

            <div class="flex flex-col gap-1">
                <label for="{id}-source" class="font-semibold">Source</label>
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
                    class="{field} font-mono"
                    aria-describedby="{id}-source-help"
                />
                <p id="{id}-source-help" class="text-sm text-muted">
                    The name of the image on linuxcontainers.org. An image that does not exist there
                    never becomes ready, and the list says so.
                </p>
            </div>

            <div class="flex flex-col gap-1">
                <label for="{id}-aliases" class="font-semibold">Aliases (optional)</label>
                <input
                    id="{id}-aliases"
                    name="aliases"
                    value={form?.create?.values?.aliases ?? ''}
                    autocomplete="off"
                    autocapitalize="off"
                    spellcheck="false"
                    class="{field} font-mono"
                    aria-describedby="{id}-aliases-help"
                />
                <p id="{id}-aliases-help" class="text-sm text-muted">
                    Other names for the image, separated by spaces or commas: {MAX_ALIASES} at most.
                </p>
            </div>

            <div>
                <button
                    type="submit"
                    class="cursor-pointer rounded bg-primary px-5 py-2 font-semibold text-on-primary"
                    >Pull the image</button
                >
            </div>
        </form>
    </section>
</main>
