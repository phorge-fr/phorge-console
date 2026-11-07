<script lang="ts">
    import type { Snippet } from 'svelte';
    import ArrowLeft from '@lucide/svelte/icons/arrow-left';

    // The top of every page: where the person is, and the one main action of the page on the right.
    let {
        title,
        subtitle,
        back,
        status,
        actions
    }: {
        title: string;
        /** A second line under the title: the technical name, a short sentence. */
        subtitle?: string;
        back?: { href: string; label: string };
        /** What follows the title on the same line: a badge. */
        status?: Snippet;
        actions?: Snippet;
    } = $props();
</script>

<header class="mb-8">
    {#if back}
        <a
            href={back.href}
            class="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-fg-2 no-underline hover:text-fg"
        >
            <ArrowLeft size={16} aria-hidden="true" />
            {back.label}
        </a>
    {/if}
    <div class="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div class="min-w-0 flex-1 basis-80">
            <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
                <h1 class="text-2xl font-bold tracking-tight break-words">{title}</h1>
                {#if status}{@render status()}{/if}
            </div>
            {#if subtitle}
                <p class="mt-1 max-w-2xl text-fg-3">{subtitle}</p>
            {/if}
        </div>
        {#if actions}
            <div class="flex shrink-0 flex-wrap items-center gap-2">{@render actions()}</div>
        {/if}
    </div>
</header>
