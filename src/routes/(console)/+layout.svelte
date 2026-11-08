<script lang="ts">
    import { navigating, page } from '$app/state';
    import Menu from '@lucide/svelte/icons/menu';
    import X from '@lucide/svelte/icons/x';
    import Alert from '#lib/components/Alert.svelte';
    import AppNav from '#lib/components/AppNav.svelte';

    let { data, children } = $props();

    // The menu of a phone is a <details>, so that it works without JavaScript; it closes when the person goes elsewhere.
    let menu: HTMLDetailsElement | undefined = $state();
    let menuOpen = $state(false);
    $effect(() => {
        void page.url.pathname;
        if (menu) menu.open = false;
    });
</script>

<svelte:head>
    <meta name="robots" content="noindex" />
</svelte:head>

{#snippet wordmark(size: string)}
    <a href="/" class="inline-flex" aria-label="Phorge console, your tenants">
        <img
            class="logo-light {size} w-auto"
            src="/brand/logo-wordmark-light.svg"
            alt="Phorge"
            width="242"
            height="86"
        />
        <img
            class="logo-dark {size} w-auto"
            src="/brand/logo-wordmark-dark.svg"
            alt="Phorge"
            width="242"
            height="86"
        />
    </a>
{/snippet}

<!-- Loading: a thin bar at the top while the next page is fetched, and the same words for a screen reader. -->
{#if navigating.to}
    <div class="fixed inset-x-0 top-0 z-50 h-0.5 animate-pulse bg-primary" aria-hidden="true"></div>
{/if}
<div class="sr-only" role="status">{navigating.to ? 'Loading…' : ''}</div>

<div class="min-h-screen md:grid md:grid-cols-[16rem_minmax(0,1fr)]">
    <!-- A phone: a bar with the wordmark and a menu button. -->
    <details
        bind:this={menu}
        class="sticky top-0 z-40 border-b border-line bg-surface md:hidden"
        ontoggle={() => (menuOpen = menu?.open ?? false)}
    >
        <summary
            class="flex h-14 cursor-pointer list-none items-center justify-between px-4 [&::-webkit-details-marker]:hidden"
        >
            {@render wordmark('h-7')}
            <span class="btn-ghost -mr-2 size-10 px-0">
                {#if menuOpen}
                    <X size={20} aria-hidden="true" />
                {:else}
                    <Menu size={20} aria-hidden="true" />
                {/if}
                <span class="sr-only">{menuOpen ? 'Close the menu' : 'Open the menu'}</span>
            </span>
        </summary>
        <div class="max-h-[calc(100vh-3.5rem)] overflow-y-auto px-4 pb-4 pt-2">
            <AppNav
                user={data.user}
                tenants={data.tenants}
                canCreateTenants={data.canCreateTenants}
            />
        </div>
    </details>

    <!-- A desktop: a side column that stays in place. -->
    <aside
        class="sticky top-0 hidden h-screen flex-col gap-6 overflow-y-auto border-r border-line bg-surface px-3 py-4 md:flex"
    >
        <div class="px-2.5">{@render wordmark('h-7')}</div>
        <AppNav user={data.user} tenants={data.tenants} canCreateTenants={data.canCreateTenants} />
    </aside>

    <div class="min-w-0">
        {#if data.notice}
            <div class="mx-auto w-full max-w-5xl px-4 pt-6 md:px-10">
                <Alert tone="warning" title="The list of your tenants could not be loaded.">
                    {data.notice}
                </Alert>
            </div>
        {/if}
        {@render children()}
    </div>
</div>
