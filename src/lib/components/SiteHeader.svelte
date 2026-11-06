<script lang="ts">
    import type { Snippet } from 'svelte';

    // The navigation is given by the page group that uses the header; it can be empty.
    let { nav }: { nav?: Snippet } = $props();
</script>

<header class="border-b border-accent bg-surface">
    <div class="mx-auto flex max-w-5xl items-center justify-between gap-6 px-4 py-3">
        <a href="/" class="inline-flex" aria-label="Phorge, home">
            <img
                class="logo-light h-8 w-auto"
                src="/brand/logo-wordmark-light.svg"
                alt="Phorge"
                width="242"
                height="86"
            />
            <img
                class="logo-dark h-8 w-auto"
                src="/brand/logo-wordmark-dark.svg"
                alt="Phorge"
                width="242"
                height="86"
            />
        </a>
        {#if nav}
            <nav aria-label="Main" class="flex gap-6 font-semibold">
                {@render nav()}
            </nav>
        {/if}
    </div>
</header>
