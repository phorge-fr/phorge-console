<script lang="ts">
    import Copy from '@lucide/svelte/icons/copy';
    import { untrack } from 'svelte';
    import { SvelteSet } from 'svelte/reactivity';
    import Alert from '#lib/components/Alert.svelte';
    import PageHeader from '#lib/components/PageHeader.svelte';
    import { MAX_GRANTS, MAX_NAME_LENGTH, SCOPES } from '#lib/apikeys';

    let { data, form } = $props();

    const id = $props.id();
    const created = $derived(form?.created);
    const tenants = $derived(data.tenants ?? []);
    // The rights of the key: one entry per tenant and scope that is ticked. A tenant that the search hides keeps its ticks and is
    // still sent: the rows are hidden, not removed.
    const ticks = new SvelteSet<string>();
    const keyOf = (tenant: string, scope: string) => `${tenant}|${scope}`;
    // After a refused submission the page starts from what was sent.
    untrack(() => {
        for (const [tenant, scopes] of Object.entries(form?.values?.ticked ?? {}))
            for (const scope of scopes) ticks.add(keyOf(tenant, scope));
    });
    let search = $state('');
    let onlyTicked = $state(false);
    const label = (t: { name: string; displayName?: string }) => t.displayName || t.name;
    const covered = $derived(new Set([...ticks].map((entry) => entry.split('|')[0])));
    const shown = $derived(
        tenants.filter(
            (t) =>
                `${t.name} ${label(t)}`.toLowerCase().includes(search.trim().toLowerCase()) &&
                (!onlyTicked || covered.has(t.name))
        )
    );
    const toggle = (tenant: string, scope: string, on: boolean) =>
        on ? ticks.add(keyOf(tenant, scope)) : ticks.delete(keyOf(tenant, scope));
    // A column is ticked for every tenant the search shows, or cleared for them.
    const columnOn = (scope: string) =>
        shown.length > 0 && shown.every((t) => ticks.has(keyOf(t.name, scope)));
    const toggleColumn = (scope: string, on: boolean) =>
        shown.forEach((t) => toggle(t.name, scope, on));
    // The two header rows: a resource, then what may be done to it.
    const groups = [
        { title: 'Tenant', scopes: [{ scope: 'tenants:read', verb: 'See' }] },
        {
            title: 'Instances',
            scopes: [
                { scope: 'instances:read', verb: 'See' },
                { scope: 'instances:write', verb: 'Change' }
            ]
        },
        {
            title: 'Images',
            scopes: [
                { scope: 'images:read', verb: 'See' },
                { scope: 'images:write', verb: 'Change' }
            ]
        },
        {
            title: 'Members',
            scopes: [
                { scope: 'memberships:read', verb: 'See' },
                { scope: 'memberships:write', verb: 'Change' }
            ]
        }
    ];
    const wording = Object.fromEntries(SCOPES.map((s) => [s.scope, s.label]));
    // The earliest day a key may expire: tomorrow (the API checks the end of the day against the clock).
    const tomorrow = new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 10);

    let copied = $state<'key' | 'identity' | undefined>();
    async function copy(what: 'key' | 'identity', text: string) {
        try {
            await navigator.clipboard.writeText(text);
            copied = what;
            setTimeout(() => (copied = undefined), 2000);
        } catch {
            // The field can be selected by hand.
        }
    }
</script>

<svelte:head>
    <title>{created ? 'Your new key' : 'Create an API key'} · Phorge console</title>
</svelte:head>

<main class="mx-auto w-full max-w-5xl px-4 py-8 md:px-10">
    {#if created}
        <PageHeader
            title="Your new key"
            subtitle="“{created.displayName}” is ready."
            back={{ href: '/api-keys', label: 'API keys' }}
        />
        <div class="flex max-w-xl flex-col gap-6">
            <Alert tone="warning" title="Copy the key now">
                It is shown this once. Phorge does not keep it and cannot show it again: if you lose
                it, revoke the key and create another.
            </Alert>

            <div class="flex flex-col gap-1.5">
                <label for="{id}-identity" class="field-label">User name</label>
                <div class="flex gap-2">
                    <input
                        id="{id}-identity"
                        readonly
                        value={created.identity}
                        class="field font-mono"
                        onfocus={(e) => e.currentTarget.select()}
                    />
                    <button
                        type="button"
                        class="btn-secondary shrink-0"
                        onclick={() => copy('identity', created.identity)}
                    >
                        <Copy size={16} aria-hidden="true" />
                        {copied === 'identity' ? 'Copied' : 'Copy'}
                    </button>
                </div>
            </div>

            <div class="flex flex-col gap-1.5">
                <label for="{id}-key" class="field-label">Key</label>
                <div class="flex gap-2">
                    <input
                        id="{id}-key"
                        readonly
                        value={created.key}
                        class="field font-mono"
                        autocomplete="off"
                        onfocus={(e) => e.currentTarget.select()}
                    />
                    <button
                        type="button"
                        class="btn-secondary shrink-0"
                        onclick={() => created.key && copy('key', created.key)}
                    >
                        <Copy size={16} aria-hidden="true" />
                        {copied === 'key' ? 'Copied' : 'Copy'}
                    </button>
                </div>
                <p class="help">
                    The user name and the key are what you give Authentik, as a client credentials
                    sign-in, to get an access token for the API.
                    {#if created.expiresAt}
                        The key stops working on
                        <time datetime={created.expiresAt}
                            >{new Date(created.expiresAt).toLocaleDateString('en-GB', {
                                dateStyle: 'long',
                                timeZone: 'UTC'
                            })}</time
                        >.
                    {/if}
                </p>
            </div>

            <div><a href="/api-keys" class="btn-primary">I have copied it, go to my keys</a></div>
        </div>
    {:else}
        <PageHeader
            title="Create an API key"
            subtitle="A key can never do more than you can. You choose what it may do, on which tenants, and until when."
            back={{ href: '/api-keys', label: 'API keys' }}
        />

        <form method="POST" class="flex max-w-xl flex-col gap-7">
            {#if form?.message}
                <Alert tone="danger">{form.message}</Alert>
            {/if}

            <div class="flex flex-col gap-1.5">
                <label for="{id}-name" class="field-label">Name</label>
                <input
                    id="{id}-name"
                    name="displayName"
                    required
                    maxlength={MAX_NAME_LENGTH}
                    value={form?.values?.displayName ?? ''}
                    placeholder="CI of the infra"
                    autocomplete="off"
                    class="field max-w-md"
                    aria-describedby="{id}-name-help"
                />
                <p id="{id}-name-help" class="help">
                    To recognize it in the list. It can be changed later.
                </p>
            </div>

            <div class="flex flex-col gap-1.5">
                <label for="{id}-expires" class="field-label">Expires on</label>
                <input
                    id="{id}-expires"
                    name="expires"
                    type="date"
                    required
                    min={tomorrow}
                    value={form?.values?.expires ?? ''}
                    class="field max-w-48"
                    aria-describedby="{id}-expires-help"
                />
                <p id="{id}-expires-help" class="help">
                    A key always expires, and the date cannot change. The platform may set a
                    maximum, and says so if you go over it.
                </p>
            </div>

            <fieldset class="m-0 flex min-w-0 flex-col gap-3 border-0 p-0">
                <legend class="field-label mb-1 p-0">What it may do, on which tenants</legend>
                {#if tenants.length === 0}
                    <Alert tone="info"
                        >You are not in a tenant yet: there is nothing to give a key.</Alert
                    >
                {:else}
                    <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
                        <label class="sr-only" for="{id}-search">Search a tenant</label>
                        <input
                            id="{id}-search"
                            type="search"
                            bind:value={search}
                            placeholder="Search a tenant"
                            autocomplete="off"
                            class="field max-w-64"
                        />
                        <label class="flex items-center gap-2 text-sm">
                            <input type="checkbox" bind:checked={onlyTicked} />
                            Only the tenants with rights
                        </label>
                        <span
                            class="tnum ml-auto text-sm {covered.size > MAX_GRANTS
                                ? 'font-semibold text-bad-fg'
                                : 'text-fg-3'}"
                            role="status"
                        >
                            {covered.size} of {MAX_GRANTS} tenants
                        </span>
                    </div>

                    <div class="panel max-h-[28rem] overflow-auto">
                        <table class="w-full min-w-[34rem] border-collapse text-left text-sm">
                            <thead class="sticky top-0 z-10 bg-surface">
                                <tr class="border-b border-line">
                                    <th
                                        scope="col"
                                        rowspan="2"
                                        class="px-3 py-2 align-bottom font-semibold"
                                    >
                                        Tenant
                                    </th>
                                    {#each groups as group (group.title)}
                                        <th
                                            scope="colgroup"
                                            colspan={group.scopes.length}
                                            class="border-l border-line px-2 pt-2 text-center font-semibold"
                                            >{group.title}</th
                                        >
                                    {/each}
                                </tr>
                                <tr class="border-b border-line text-fg-2">
                                    {#each groups as group (group.title)}
                                        {#each group.scopes as item (item.scope)}
                                            <th
                                                scope="col"
                                                class="border-l border-line px-2 pb-2 text-center font-normal"
                                            >
                                                <label class="flex flex-col items-center gap-1">
                                                    <span>{item.verb}</span>
                                                    <input
                                                        type="checkbox"
                                                        checked={columnOn(item.scope)}
                                                        onchange={(e) =>
                                                            toggleColumn(
                                                                item.scope,
                                                                e.currentTarget.checked
                                                            )}
                                                        aria-label="Tick “{wording[
                                                            item.scope
                                                        ]}” for the tenants shown"
                                                    />
                                                </label>
                                            </th>
                                        {/each}
                                    {/each}
                                </tr>
                            </thead>
                            <tbody>
                                {#each tenants as tenant (tenant.name)}
                                    <tr
                                        class="border-b border-line last:border-b-0 hover:bg-surface"
                                        hidden={!shown.includes(tenant)}
                                    >
                                        <th scope="row" class="px-3 py-2 text-left font-normal">
                                            <span class="block truncate font-semibold"
                                                >{label(tenant)}</span
                                            >
                                            {#if tenant.displayName}
                                                <span class="block font-mono text-xs text-fg-3"
                                                    >{tenant.name}</span
                                                >
                                            {/if}
                                        </th>
                                        {#each SCOPES as item (item.scope)}
                                            <td class="border-l border-line px-2 py-2 text-center">
                                                <input
                                                    type="checkbox"
                                                    name="scope:{tenant.name}"
                                                    value={item.scope}
                                                    checked={ticks.has(
                                                        keyOf(tenant.name, item.scope)
                                                    )}
                                                    onchange={(e) =>
                                                        toggle(
                                                            tenant.name,
                                                            item.scope,
                                                            e.currentTarget.checked
                                                        )}
                                                    aria-label="{label(
                                                        tenant
                                                    )}: {item.label.toLowerCase()}"
                                                />
                                            </td>
                                        {/each}
                                    </tr>
                                {/each}
                                {#if shown.length === 0}
                                    <tr>
                                        <td colspan="8" class="px-3 py-4 text-fg-3">
                                            No tenant matches.
                                        </td>
                                    </tr>
                                {/if}
                            </tbody>
                        </table>
                    </div>
                    <p class="help">
                        “Change” is its own right: it does not let the key see. Tick both if it
                        needs both. A key covers {MAX_GRANTS} tenants at most; for more, make another
                        key.
                    </p>
                {/if}
            </fieldset>

            <div class="flex flex-wrap items-center gap-3">
                <button type="submit" class="btn-primary" disabled={tenants.length === 0}
                    >Create the key</button
                >
                <a href="/api-keys" class="btn-ghost">Cancel</a>
            </div>
        </form>
    {/if}
</main>
