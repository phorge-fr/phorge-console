<script lang="ts">
    import X from '@lucide/svelte/icons/x';
    import { SvelteSet } from 'svelte/reactivity';
    import { GROUP_HELP, SCOPE_GROUPS } from '#lib/apikeys';

    // One rule of an API key: what it may do (the rights ticked) and on which tenants (the ones chosen). The rights come from the
    // list of `#lib/apikeys`, so a new right of the API shows up here without changing this component. The fields are named
    // `rule.<n>.scope` and `rule.<n>.tenant`; the tenants chosen are sent as hidden fields, so the list can be long and searched.
    let {
        index,
        scopes,
        chosen,
        tenants,
        removable,
        onremove
    }: {
        index: number;
        scopes: SvelteSet<string>;
        chosen: SvelteSet<string>;
        tenants: { name: string; displayName?: string }[];
        removable: boolean;
        onremove: () => void;
    } = $props();

    const id = $props.id();
    const SHOWN = 8;
    let search = $state('');
    const label = (t: { name: string; displayName?: string }) => t.displayName || t.name;
    const matches = $derived(
        tenants.filter(
            (t) =>
                !chosen.has(t.name) &&
                `${t.name} ${label(t)}`.toLowerCase().includes(search.trim().toLowerCase())
        )
    );
    const byName = $derived(new Map(tenants.map((t) => [t.name, t])));

    // The access of a resource is one choice: none, one of its scopes, or all of them. The names are the ones of the API
    // (`instances:read`, `instances:write`), so that what is chosen is exactly what the key gets.
    const optionsOf = (group: string[]) =>
        group.length === 1 ? group : [...group, group.join(',')];
    const currentOf = (group: string[]) => {
        const held = group.filter((scope) => scopes.has(scope));
        return held.length === 0 ? '' : held.join(',');
    };
    const choose = (group: string[], value: string) => {
        group.forEach((scope) => scopes.delete(scope));
        if (value) value.split(',').forEach((scope) => scopes.add(scope));
    };
</script>

<fieldset class="panel m-0 flex min-w-0 flex-col gap-5 p-4">
    <legend class="px-1 font-semibold">Rule {index + 1}</legend>

    <div class="flex flex-col gap-2">
        <p class="field-label">Permissions</p>
        <div class="flex flex-col divide-y divide-line rounded-md border border-line">
            {#each SCOPE_GROUPS as group (group.group)}
                {@const options = optionsOf(group.items.map((item) => item.scope))}
                <div
                    class="grid items-center gap-x-4 gap-y-2 px-3 py-2.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,17rem)]"
                >
                    <div>
                        <label for="{id}-{group.group}" class="font-semibold">{group.group}</label>
                        <span class="block text-sm text-fg-3">{GROUP_HELP[group.group] ?? ''}</span>
                    </div>
                    <select
                        id="{id}-{group.group}"
                        class="field font-mono text-sm"
                        value={currentOf(group.items.map((item) => item.scope))}
                        onchange={(e) =>
                            choose(
                                group.items.map((item) => item.scope),
                                e.currentTarget.value
                            )}
                    >
                        <option value="">No access</option>
                        {#each options as option (option)}
                            <option value={option}>{option.split(',').join(', ')}</option>
                        {/each}
                    </select>
                </div>
            {/each}
        </div>
        {#each [...scopes] as scope (scope)}
            <input type="hidden" name="rule.{index}.scope" value={scope} />
        {/each}
    </div>

    <div class="flex flex-col gap-2">
        <label for="{id}-search" class="field-label">On these tenants</label>
        {#if chosen.size > 0}
            <ul class="m-0 flex list-none flex-wrap gap-1.5 p-0">
                {#each [...chosen] as name (name)}
                    <li
                        class="inline-flex items-center gap-1 rounded-full bg-surface-2 py-0.5 pl-2.5 pr-1 text-sm"
                    >
                        <input type="hidden" name="rule.{index}.tenant" value={name} />
                        {label(byName.get(name) ?? { name })}
                        <button
                            type="button"
                            class="grid size-5 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-fg-2 hover:bg-bg hover:text-fg"
                            onclick={() => chosen.delete(name)}
                            aria-label="Remove {label(byName.get(name) ?? { name })}"
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
            bind:value={search}
            placeholder="Search a tenant to add"
            autocomplete="off"
            class="field max-w-sm"
        />
        <ul class="m-0 flex max-w-sm list-none flex-col p-0">
            {#each matches.slice(0, SHOWN) as tenant (tenant.name)}
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
        {#if matches.length > SHOWN}
            <p class="help">
                {matches.length - SHOWN} more.
                {#if matches.length <= 50}
                    <button
                        type="button"
                        class="cursor-pointer border-0 bg-transparent p-0 font-semibold text-primary underline"
                        onclick={() => matches.forEach((t) => chosen.add(t.name))}
                        >Add all {matches.length}</button
                    >
                    or refine the search.
                {:else}
                    Refine the search.
                {/if}
            </p>
        {:else if matches.length === 0 && search.trim()}
            <p class="help">No tenant matches “{search}”.</p>
        {/if}
    </div>

    {#if removable}
        <div>
            <button type="button" class="btn-ghost -ml-3" onclick={onremove}
                >Remove this rule</button
            >
        </div>
    {/if}
</fieldset>
