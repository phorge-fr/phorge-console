<script lang="ts">
    import type { Snippet } from 'svelte';

    // An empty list teaches the screen: what the thing is, and what to do about it.
    let { title, children, action }: { title: string; children?: Snippet; action?: Snippet } =
        $props();
</script>

<section class="rounded-lg border border-dashed border-ctl px-6 py-10 text-center">
    <h2 class="text-lg font-semibold">{title}</h2>
    {#if children}
        <div class="mx-auto mt-2 max-w-md text-fg-2">
            {@render children()}
        </div>
    {/if}
    {#if action}
        <div class="mt-5 flex justify-center">
            {@render action()}
        </div>
    {/if}
</section>
