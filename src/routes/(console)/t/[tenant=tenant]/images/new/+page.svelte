<script lang="ts">
    import Alert from '#lib/components/Alert.svelte';
    import PageHeader from '#lib/components/PageHeader.svelte';
    import { IMAGE_NAME_PATTERN, MAX_ALIASES } from '#lib/images';

    let { data, form } = $props();

    const id = $props.id();
    const list = $derived(`/t/${data.tenant.name}/images`);
</script>

<svelte:head>
    <title>Pull an image · {data.tenant.displayName || data.tenant.name} · Phorge console</title>
</svelte:head>

<main class="mx-auto w-full max-w-5xl px-4 py-8 md:px-10">
    <PageHeader
        title="Pull an image"
        subtitle="From the public image server. The name is what your virtual machines start from."
        back={{ href: list, label: 'Images' }}
    />

    <form method="POST" class="flex max-w-xl flex-col gap-6">
        {#if form?.message}
            <Alert tone="danger">{form.message}</Alert>
        {/if}

        <div class="flex flex-col gap-1.5">
            <label for="{id}-name" class="field-label">Name</label>
            <input
                id="{id}-name"
                name="name"
                required
                maxlength="63"
                pattern={IMAGE_NAME_PATTERN}
                value={form?.values?.name ?? ''}
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
                value={form?.values?.source ?? ''}
                autocomplete="off"
                autocapitalize="off"
                spellcheck="false"
                placeholder="debian/13/cloud"
                class="field font-mono"
                aria-describedby="{id}-source-help"
            />
            <p id="{id}-source-help" class="help">
                The name of the image on linuxcontainers.org. Choose a
                <code class="font-mono">cloud</code> variant to use SSH keys. An image that does not exist
                there never becomes ready.
            </p>
        </div>

        <div class="flex flex-col gap-1.5">
            <label for="{id}-aliases" class="field-label">
                Aliases <span class="font-normal text-fg-3">(optional)</span>
            </label>
            <input
                id="{id}-aliases"
                name="aliases"
                value={form?.values?.aliases ?? ''}
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

        <div class="flex flex-wrap items-center gap-3">
            <button type="submit" class="btn-primary">Pull the image</button>
            <a href={list} class="btn-ghost">Cancel</a>
        </div>
    </form>
</main>
