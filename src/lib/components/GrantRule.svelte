<script lang="ts">
    import X from '@lucide/svelte/icons/x';
    import { SvelteSet } from 'svelte/reactivity';
    import { SCOPES } from '#lib/apikeys';

    // One rule of an API key: the permissions it gives (by the names of the API, like `instances:read`) and the tenants it covers.
    // A closed rule is one line, so that many rules stay short; one rule is open at a time. Permissions and tenants are picked by
    // search and shown as chips, so neither list has to fit on the page. The fields are named `rule.<n>.scope` and `rule.<n>.tenant`
    // and are always sent, whether the rule is open or not.
    let {
        index,
        scopes,
        chosen,
        tenants,
        open,
        removable,
        onopen,
        onclose,
        onremove
    }: {
        index: number;
        scopes: SvelteSet<string>;
        chosen: SvelteSet<string>;
        tenants: { name: string; displayName?: string }[];
        open: boolean;
        removable: boolean;
        onopen: () => void;
        onclose: () => void;
        onremove: () => void;
    } = $props();

    const id = $props.id();
    const SHOWN = 8;
    const label = (t: { name: string; displayName?: string }) => t.displayName || t.name;
    const byName = $derived(new Map(tenants.map((t) => [t.name, t])));
    const nameOf = (name: string) => label(byName.get(name) ?? { name });

    let tenantSearch = $state('');
    const tenantMatches = $derived(
        tenants.filter(
            (t) =>
                !chosen.has(t.name) &&
                `${t.name} ${label(t)}`.toLowerCase().includes(tenantSearch.trim().toLowerCase())
        )
    );
    let scopeSearch = $state('');
    const scopeMatches = $derived(
        SCOPES.filter(
            (s) =>
                !scopes.has(s.scope) &&
                `${s.scope} ${s.label} ${s.group}`
                    .toLowerCase()
                    .includes(scopeSearch.trim().toLowerCase())
        )
    );
    const complete = $derived(scopes.size > 0 && chosen.size > 0);
    const some = (names: string[], max: number) =>
        names.length <= max
            ? names.join(', ')
            : `${names.slice(0, max).join(', ')} and ${names.length - max} more`;
</script>

{#each [...scopes] as scope (scope)}
    <input type="hidden" name="rule.{index}.scope" value={scope} />
{/each}
{#each [...chosen] as name (name)}
    <input type="hidden" name="rule.{index}.tenant" value={name} />
{/each}

{#if !open}
    <div class="panel flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <div class="min-w-0 flex-1">
            <p class="font-semibold">Rule {index + 1}</p>
            {#if complete}
                <p class="truncate text-sm text-fg-2">
                    <span class="font-mono">{some([...scopes], 3)}</span>
                    on {some([...chosen].map(nameOf), 3)}
                </p>
            {:else}
                <p class="text-sm text-warn-fg">Needs at least one permission and one tenant.</p>
            {/if}
        </div>
        <button type="button" class="btn-ghost" onclick={onopen}>Edit</button>
        {#if removable}
            <button type="button" class="btn-ghost" onclick={onremove}>Remove</button>
        {/if}
    </div>
{:else}
    <fieldset class="panel m-0 flex min-w-0 flex-col gap-6 p-4">
        <legend class="px-1 font-semibold">Rule {index + 1}</legend>

        <div class="flex flex-col gap-2">
            <label for="{id}-scope" class="field-label">Permissions</label>
            {#if scopes.size > 0}
                <ul class="m-0 flex list-none flex-wrap gap-1.5 p-0">
                    {#each [...scopes] as scope (scope)}
                        <li
                            class="inline-flex items-center gap-1 rounded-full bg-surface-2 py-0.5 pl-2.5 pr-1 font-mono text-sm"
                        >
                            {scope}
                            <button
                                type="button"
                                class="grid size-5 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-fg-2 hover:bg-bg hover:text-fg"
                                onclick={() => scopes.delete(scope)}
                                aria-label="Remove {scope}"
                            >
                                <X size={12} aria-hidden="true" />
                            </button>
                        </li>
                    {/each}
                </ul>
            {:else}
                <p class="text-sm text-fg-3">
                    No permission yet. Search below and add the ones it gives.
                </p>
            {/if}
            <input
                id="{id}-scope"
                type="search"
                bind:value={scopeSearch}
                placeholder="Search a permission, like instances:read"
                autocomplete="off"
                class="field max-w-md"
            />
            <ul class="m-0 flex max-w-md list-none flex-col p-0">
                {#each scopeMatches.slice(0, SHOWN) as item (item.scope)}
                    <li>
                        <button
                            type="button"
                            class="flex w-full cursor-pointer items-baseline justify-between gap-3 rounded-md border-0 bg-transparent px-2.5 py-1.5 text-left hover:bg-surface-2"
                            onclick={() => scopes.add(item.scope)}
                        >
                            <span class="font-mono font-semibold">{item.scope}</span>
                            <span class="truncate text-sm text-fg-3">{item.label}</span>
                        </button>
                    </li>
                {/each}
            </ul>
            {#if scopeMatches.length > SHOWN}
                <p class="help">{scopeMatches.length - SHOWN} more. Refine the search.</p>
            {:else if scopeMatches.length === 0 && scopeSearch.trim()}
                <p class="help">No permission matches “{scopeSearch}”.</p>
            {/if}
        </div>

        <div class="flex flex-col gap-2">
            <label for="{id}-search" class="field-label">On these tenants</label>
            {#if chosen.size > 0}
                <ul class="m-0 flex list-none flex-wrap gap-1.5 p-0">
                    {#each [...chosen] as name (name)}
                        <li
                            class="inline-flex items-center gap-1 rounded-full bg-surface-2 py-0.5 pl-2.5 pr-1 text-sm"
                        >
                            {nameOf(name)}
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
                <p class="text-sm text-fg-3">
                    No tenant yet. Search below and pick the ones it covers.
                </p>
            {/if}
            <input
                id="{id}-search"
                type="search"
                bind:value={tenantSearch}
                placeholder="Search a tenant to add"
                autocomplete="off"
                class="field max-w-md"
            />
            <ul class="m-0 flex max-w-md list-none flex-col p-0">
                {#each tenantMatches.slice(0, SHOWN) as tenant (tenant.name)}
                    <li>
                        <button
                            type="button"
                            class="flex w-full cursor-pointer items-center justify-between gap-3 rounded-md border-0 bg-transparent px-2.5 py-1.5 text-left hover:bg-surface-2"
                            onclick={() => chosen.add(tenant.name)}
                        >
                            <span class="truncate">{label(tenant)}</span>
                            {#if tenant.displayName}
                                <span class="font-mono text-xs text-fg-3">{tenant.name}</span>
                            {/if}
                        </button>
                    </li>
                {/each}
            </ul>
            {#if tenantMatches.length > SHOWN}
                <p class="help">
                    {tenantMatches.length - SHOWN} more.
                    {#if tenantMatches.length <= 50}
                        <button
                            type="button"
                            class="cursor-pointer border-0 bg-transparent p-0 font-semibold text-primary underline"
                            onclick={() => tenantMatches.forEach((t) => chosen.add(t.name))}
                            >Add all {tenantMatches.length}</button
                        >
                        or refine the search.
                    {:else}
                        Refine the search.
                    {/if}
                </p>
            {:else if tenantMatches.length === 0 && tenantSearch.trim()}
                <p class="help">No tenant matches “{tenantSearch}”.</p>
            {/if}
        </div>

        <div class="flex flex-wrap items-center gap-2">
            <button type="button" class="btn-secondary" disabled={!complete} onclick={onclose}>
                Done
            </button>
            {#if removable}
                <button type="button" class="btn-ghost" onclick={onremove}>Remove this rule</button>
            {/if}
        </div>
    </fieldset>
{/if}
