<script lang="ts">
    import X from '@lucide/svelte/icons/x';
    import type { SvelteSet } from 'svelte/reactivity';
    import SearchPicker, { type PickItem } from '#lib/components/SearchPicker.svelte';

    // Many things to choose from, a few chosen: the chosen ones are removable chips, in the order they were picked, and the others
    // are found by search (`SearchPicker`). Used for the tenants of an API key rule and the networks of an instance. The caller
    // sends the chosen names itself (hidden fields), so the field names stay its own. It needs JavaScript: see `SearchPicker`.
    let {
        id,
        items,
        chosen,
        noun,
        empty,
        placeholder,
        mono = false,
        ordinal,
        max,
        addAll = false
    }: {
        // The id of the search field, for the label of the caller.
        id: string;
        items: PickItem[];
        // The names chosen. A set keeps the order of insertion, which the caller may rely on.
        chosen: SvelteSet<string>;
        noun: string;
        // What is said while nothing is chosen.
        empty: string;
        placeholder?: string;
        mono?: boolean;
        // A mark shown before each chip, from its place in the order (`eth0`, `eth1`, ...).
        ordinal?: (index: number) => string;
        // The most that can be chosen: past it nothing more is offered.
        max?: number;
        addAll?: boolean;
    } = $props();

    const byName = $derived(new Map(items.map((item) => [item.name, item])));
    const nameOf = (name: string) => {
        const item = byName.get(name);
        return item?.label || name;
    };
    const left = $derived(items.filter((item) => !chosen.has(item.name)));
    const full = $derived(max !== undefined && chosen.size >= max);
    // The room that is left, so that "add all" never goes past the limit.
    const room = $derived(max === undefined ? undefined : max - chosen.size);
</script>

{#if chosen.size > 0}
    <ul class="m-0 flex list-none flex-wrap gap-1.5 p-0">
        {#each [...chosen] as name, index (name)}
            <li
                class="inline-flex items-center gap-1.5 rounded-full bg-surface-2 py-0.5 pl-2.5 pr-1 text-sm"
            >
                {#if ordinal}
                    <span class="font-mono text-xs text-fg-3">{ordinal(index)}</span>
                {/if}
                <span class={mono ? 'font-mono' : ''}>{nameOf(name)}</span>
                <button
                    type="button"
                    class="grid size-5 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-fg-2 hover:bg-bg hover:text-fg"
                    onclick={() => chosen.delete(name)}
                    aria-label="Remove {nameOf(name)}"
                >
                    <X size={12} aria-hidden="true" />
                </button>
            </li>
        {/each}
    </ul>
{:else}
    <p class="text-sm text-fg-3">{empty}</p>
{/if}
{#if full}
    <p class="help" aria-live="polite">
        {max}
        {noun}{max === 1 ? '' : 's'} at most: remove one to add another.
    </p>
{:else}
    <SearchPicker
        {id}
        items={left}
        {noun}
        {placeholder}
        {mono}
        onpick={(name) => chosen.add(name)}
        onpickall={addAll
            ? (names) => names.slice(0, room).forEach((name) => chosen.add(name))
            : undefined}
    />
{/if}
