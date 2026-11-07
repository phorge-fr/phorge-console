<script lang="ts">
    import type { Snippet } from 'svelte';

    let { title, children }: { title: string; children?: Snippet } = $props();
</script>

<section class="rounded border border-dashed border-accent bg-surface p-8 text-center">
    <h2 class="text-xl font-semibold">{title}</h2>
    {#if children}
        <div class="mx-auto mt-3 max-w-xl text-muted">
            {@render children()}
        </div>
    {/if}
</section>
