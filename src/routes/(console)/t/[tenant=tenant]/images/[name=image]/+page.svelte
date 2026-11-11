<script lang="ts">
    import Alert from '#lib/components/Alert.svelte';
    import AutoRefresh from '#lib/components/AutoRefresh.svelte';
    import ConfirmDelete from '#lib/components/ConfirmDelete.svelte';
    import PageHeader from '#lib/components/PageHeader.svelte';
    import PhaseBadge from '#lib/components/PhaseBadge.svelte';
    import SettingsSection from '#lib/components/SettingsSection.svelte';
    import { IMAGE_SERVER } from '#lib/images';

    let { data, form } = $props();

    const image = $derived(data.image);
    const list = $derived(`/t/${data.tenant.name}/images`);
    // The page follows an image that is being pulled or deleted.
    const busy = $derived(image.phase === 'Provisioning' || image.phase === 'Deleting');
    const notices = $derived(!!image.problems || image.phase !== 'Ready');
</script>

<svelte:head>
    <title
        >{image.name} · Images · {data.tenant.displayName || data.tenant.name} · Phorge console</title
    >
</svelte:head>

<AutoRefresh active={busy} />

<main class="mx-auto w-full max-w-5xl px-4 py-8 md:px-10">
    <PageHeader title={image.name} back={{ href: list, label: 'All images' }}>
        {#snippet status()}
            <PhaseBadge phase={image.phase} />
        {/snippet}
    </PageHeader>

    <div class="mb-8 flex flex-col gap-3" hidden={!notices}>
        {#if image.problems}
            <Alert tone="danger" title="What is wrong">{image.problems}</Alert>
        {/if}
        {#if image.phase === 'Provisioning'}
            <Alert tone="info">
                This image is being pulled, which takes a few minutes. This page follows it.
            </Alert>
        {:else if image.phase === 'Deleting'}
            <Alert tone="info">
                This image is being deleted. It disappears from the list when everything it is made
                of is gone.
            </Alert>
        {/if}
    </div>

    <SettingsSection title="Overview">
        <dl class="grid grid-cols-[max-content_minmax(0,1fr)] gap-x-8 gap-y-3">
            <dt class="text-fg-3">Source</dt>
            <dd class="font-mono break-all">
                {image.source.remote ?? IMAGE_SERVER}:{image.source.name}
            </dd>
            <dt class="text-fg-3">Fingerprint</dt>
            <dd class="font-mono text-sm break-all">
                {#if image.fingerprint}
                    {image.fingerprint}
                {:else}
                    <span class="font-sans text-base text-fg-2"
                        >Known once the image is pulled.</span
                    >
                {/if}
            </dd>
            <dt class="text-fg-3">{image.aliases.length > 1 ? 'Aliases' : 'Alias'}</dt>
            <dd>
                {#each image.aliases as alias, index (alias)}<span class="font-mono">{alias}</span
                    >{#if index < image.aliases.length - 1},
                    {/if}{:else}
                    —
                {/each}
            </dd>
            <dt class="text-fg-3">Pulled</dt>
            <dd>
                <time datetime={image.createdAt}
                    >{new Date(image.createdAt).toLocaleString('en-GB', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                        timeZone: 'UTC'
                    })} UTC</time
                >
                {#if image.createdBy}<span class="text-fg-2">by {image.createdBy}</span>{/if}
            </dd>
        </dl>
    </SettingsSection>

    <SettingsSection
        title="Instances"
        description="The virtual machines of this tenant that start from this image."
    >
        {#if data.users === undefined}
            <p class="text-fg-2">
                The instances of this tenant could not be listed. Reload the page to try again.
            </p>
        {:else if data.users.length === 0}
            <p class="text-fg-2">No instance starts from this image.</p>
        {:else}
            <ul class="flex max-w-xl flex-col divide-y divide-line border-y border-line">
                {#each data.users as instance (instance.name)}
                    <li class="flex items-center justify-between gap-3 py-2.5">
                        <a href="/t/{data.tenant.name}/instances/{instance.name}" class="font-mono"
                            >{instance.name}</a
                        >
                        <span class="text-sm text-fg-3">{instance.phase}</span>
                    </li>
                {/each}
            </ul>
        {/if}
    </SettingsSection>

    {#if image.phase !== 'Deleting'}
        <SettingsSection
            title="Delete this image"
            description="Virtual machines cannot be started from it any more."
        >
            <div class="max-w-xl">
                {#if form?.remove?.message}
                    <div class="mb-4"><Alert tone="danger">{form.remove.message}</Alert></div>
                {/if}
                <ConfirmDelete
                    name={image.name}
                    what="image"
                    consequence="Virtual machines cannot be started from it any more. The deletion is refused while a virtual machine still starts from it. You can pull it again later."
                />
            </div>
        </SettingsSection>
    {/if}
</main>
