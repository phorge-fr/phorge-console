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
    // The tenants chosen for the key, and the search that narrows the list. A tenant that the search hides stays chosen, and is still
    // sent: the rows are hidden, not removed.
    const chosen = new SvelteSet<string>();
    // After a refused submission the page starts from what was sent.
    untrack(() => form?.values?.tenants?.forEach((name) => chosen.add(name)));
    let search = $state('');
    const label = (t: { name: string; displayName?: string }) => t.displayName || t.name;
    const shown = $derived(
        tenants.filter((t) =>
            `${t.name} ${label(t)}`.toLowerCase().includes(search.trim().toLowerCase())
        )
    );
    const toggle = (name: string, on: boolean) => (on ? chosen.add(name) : chosen.delete(name));
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
                <legend class="field-label mb-1 p-0">What it may do</legend>
                <div class="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
                    {#each SCOPES as item (item.scope)}
                        <label class="flex items-start gap-2.5">
                            <input
                                type="checkbox"
                                name="scope"
                                value={item.scope}
                                checked={form?.values?.scopes?.includes(item.scope) ?? false}
                                class="mt-1"
                            />
                            <span>
                                {item.label}
                                <span class="block font-mono text-xs text-fg-3">{item.scope}</span>
                            </span>
                        </label>
                    {/each}
                </div>
                <p class="help">
                    Changing instances does not let a key see them: tick both if it needs both.
                </p>
            </fieldset>

            <fieldset class="m-0 flex min-w-0 flex-col gap-3 border-0 p-0">
                <legend class="field-label mb-1 p-0">On which tenants</legend>
                {#if tenants.length === 0}
                    <Alert tone="info"
                        >You are not in a tenant yet: there is nothing to give a key.</Alert
                    >
                {:else}
                    <div class="flex flex-wrap items-center gap-2">
                        <label class="sr-only" for="{id}-search">Search the tenants</label>
                        <input
                            id="{id}-search"
                            type="search"
                            bind:value={search}
                            placeholder="Search a tenant"
                            autocomplete="off"
                            class="field max-w-64"
                        />
                        <button
                            type="button"
                            class="btn-ghost"
                            onclick={() => shown.forEach((t) => chosen.add(t.name))}
                            >{search.trim() ? 'Choose the ones shown' : 'Choose all'}</button
                        >
                        <button type="button" class="btn-ghost" onclick={() => chosen.clear()}
                            >Clear</button
                        >
                        <span
                            class="tnum ml-auto text-sm {chosen.size > MAX_GRANTS
                                ? 'font-semibold text-bad-fg'
                                : 'text-fg-3'}"
                            role="status"
                        >
                            {chosen.size} of {MAX_GRANTS} chosen
                        </span>
                    </div>
                    <ul
                        class="panel m-0 max-h-72 list-none overflow-y-auto p-1"
                        aria-label="Tenants"
                    >
                        {#each tenants as tenant (tenant.name)}
                            <li hidden={!shown.includes(tenant)}>
                                <label
                                    class="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-1.5 hover:bg-surface"
                                >
                                    <input
                                        type="checkbox"
                                        name="tenant"
                                        value={tenant.name}
                                        checked={chosen.has(tenant.name)}
                                        onchange={(e) =>
                                            toggle(tenant.name, e.currentTarget.checked)}
                                    />
                                    <span class="min-w-0 flex-1 truncate">{label(tenant)}</span>
                                    {#if tenant.displayName}
                                        <span class="font-mono text-xs text-fg-3"
                                            >{tenant.name}</span
                                        >
                                    {/if}
                                </label>
                            </li>
                        {/each}
                        {#if shown.length === 0}
                            <li class="px-2.5 py-3 text-fg-3">No tenant matches “{search}”.</li>
                        {/if}
                    </ul>
                    <p class="help">
                        A key covers {MAX_GRANTS} tenants at most. For other rights on other tenants,
                        make another key.
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
