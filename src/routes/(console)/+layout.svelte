<script lang="ts">
    import { navigating, page } from '$app/state';
    import ConsoleHeader from '#lib/components/ConsoleHeader.svelte';
    import SectionNav from '#lib/components/SectionNav.svelte';

    let { data, children } = $props();

    const tenant = $derived(page.params.tenant);
    // The part of the tenant address the person is in, kept when they switch tenant.
    const section = $derived(page.url.pathname.split('/')[3] ?? '');
</script>

<svelte:head>
    <meta name="robots" content="noindex" />
</svelte:head>

<div class="flex min-h-screen flex-col">
    <ConsoleHeader user={data.user} tenants={data.tenants} current={tenant} {section} />
    <SectionNav {tenant} />

    <!-- Loading: a bar while the next page is fetched, and the same words for a screen reader. -->
    <div class="h-1" aria-hidden="true">
        {#if navigating.to}
            <div class="h-1 w-full animate-pulse bg-accent"></div>
        {/if}
    </div>
    <div class="sr-only" role="status">{navigating.to ? 'Loading…' : ''}</div>

    {#if data.notice}
        <div class="mx-auto mt-4 w-full max-w-6xl px-4">
            <p role="alert" class="rounded border-2 border-fg bg-surface p-4">
                <strong>The list of your tenants could not be loaded.</strong>
                {data.notice}
            </p>
        </div>
    {/if}

    <div class="flex-1">
        {@render children()}
    </div>
</div>
