<script lang="ts">
    import type { Snippet } from 'svelte';

    // A block of a page of settings: what it is on the left (a title and a sentence), and what to do on the right. On a phone the
    // two stack. Sections are separated by a hairline, never boxed in a card.
    let {
        title,
        description,
        children
    }: { title: string; description?: string; children: Snippet } = $props();

    const id = $props.id();
</script>

<section
    class="grid gap-x-10 gap-y-4 border-t border-line py-8 first:border-t-0 first:pt-0 md:grid-cols-[13rem_minmax(0,1fr)]"
    aria-labelledby="{id}-title"
>
    <div>
        <h2 id="{id}-title" class="text-base font-semibold">{title}</h2>
        {#if description}
            <p class="mt-1 text-fg-3">{description}</p>
        {/if}
    </div>
    <div class="min-w-0">{@render children()}</div>
</section>
