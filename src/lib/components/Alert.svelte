<script lang="ts">
    import type { Snippet } from 'svelte';
    import CircleX from '@lucide/svelte/icons/circle-x';
    import Info from '@lucide/svelte/icons/info';
    import TriangleExclamationPoint from '@lucide/svelte/icons/triangle-exclamation-point';

    // A message that sits next to what it is about. The tone is written in the icon and the title as well as the tint.
    let {
        tone = 'info',
        title,
        children
    }: { tone?: 'info' | 'warning' | 'danger'; title?: string; children: Snippet } = $props();

    const tones = {
        info: 'border-prog-dot bg-prog-bg text-prog-fg',
        warning: 'border-warn-dot bg-warn-bg text-warn-fg',
        danger: 'border-bad-dot bg-bad-bg text-bad-fg'
    };
</script>

<div
    role={tone === 'info' ? 'status' : 'alert'}
    class="flex items-start gap-3 rounded-lg border px-4 py-3 {tones[tone]}"
>
    <span class="mt-0.5 shrink-0">
        {#if tone === 'danger'}
            <CircleX size={18} aria-hidden="true" />
        {:else if tone === 'warning'}
            <TriangleExclamationPoint size={18} aria-hidden="true" />
        {:else}
            <Info size={18} aria-hidden="true" />
        {/if}
    </span>
    <div class="min-w-0 text-fg">
        {#if title}<p class="font-semibold">{title}</p>{/if}
        <div class={title ? 'mt-0.5 text-fg-2' : ''}>{@render children()}</div>
    </div>
</div>
