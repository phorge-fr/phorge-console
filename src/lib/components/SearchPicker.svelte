<script lang="ts" module>
    /** What can be picked: its name (what the form sends), the words shown for it when they differ, and a second line to tell it apart. */
    export type PickItem = { name: string; label?: string; hint?: string };
</script>

<script lang="ts">
    // A search field and the few results that match, to pick one thing among many without a list that grows with them. The things
    // already chosen are not given: the caller leaves them out. At most eight results are shown, then how many more there are. It
    // needs JavaScript, so a page that promises to work without it gives a plain fallback in a `<noscript>`.
    let {
        id,
        items,
        noun,
        placeholder = `Search a ${noun} to add`,
        mono = false,
        onpick,
        onpickall
    }: {
        id: string;
        items: PickItem[];
        noun: string;
        placeholder?: string;
        mono?: boolean;
        onpick: (name: string) => void;
        // When given, "Add all" is offered for a short list of matches.
        onpickall?: (names: string[]) => void;
    } = $props();

    const SHOWN = 8;
    const label = (item: PickItem) => item.label || item.name;
    let search = $state('');
    const matches = $derived(
        items.filter((item) =>
            `${item.name} ${label(item)} ${item.hint ?? ''}`
                .toLowerCase()
                .includes(search.trim().toLowerCase())
        )
    );
    // The field is emptied once nothing else matches it, so that the picked thing does not leave "No network matches" behind. While
    // others match it stays, to pick several of the same kind.
    function pick(name: string) {
        const others = matches.filter((item) => item.name !== name);
        onpick(name);
        if (others.length === 0) search = '';
    }
    // Enter picks the first result instead of sending the form that holds the field.
    function onkeydown(event: KeyboardEvent) {
        if (event.key !== 'Enter' || !search.trim()) return;
        event.preventDefault();
        if (matches[0]) pick(matches[0].name);
    }
</script>

<input
    {id}
    type="search"
    bind:value={search}
    {placeholder}
    {onkeydown}
    autocomplete="off"
    autocapitalize="off"
    spellcheck="false"
    class="field max-w-md"
/>
<ul class="m-0 flex max-w-md list-none flex-col p-0">
    {#each matches.slice(0, SHOWN) as item (item.name)}
        <li>
            <button
                type="button"
                class="flex w-full cursor-pointer items-center justify-between gap-3 rounded-md border-0 bg-transparent px-2.5 py-1.5 text-left hover:bg-surface-2"
                onclick={() => pick(item.name)}
            >
                <span class="truncate {mono ? 'font-mono' : ''}">{label(item)}</span>
                {#if item.hint}
                    <span class="truncate font-mono text-xs text-fg-3">{item.hint}</span>
                {/if}
            </button>
        </li>
    {/each}
</ul>
{#if matches.length > SHOWN}
    <p class="help" aria-live="polite">
        {matches.length - SHOWN} more.
        {#if onpickall && matches.length <= 50}
            <button
                type="button"
                class="cursor-pointer border-0 bg-transparent p-0 font-semibold text-primary underline"
                onclick={() => onpickall(matches.map((item) => item.name))}
                >Add all {matches.length}</button
            >
            or refine the search.
        {:else}
            Refine the search.
        {/if}
    </p>
{:else if matches.length === 0 && search.trim()}
    <p class="help" aria-live="polite">No {noun} matches “{search}”.</p>
{/if}
