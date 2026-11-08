<script lang="ts">
    import Copy from '@lucide/svelte/icons/copy';
    import Plus from '@lucide/svelte/icons/plus';
    import { untrack } from 'svelte';
    import { SvelteSet } from 'svelte/reactivity';
    import Alert from '#lib/components/Alert.svelte';
    import GrantRule from '#lib/components/GrantRule.svelte';
    import PageHeader from '#lib/components/PageHeader.svelte';
    import { MAX_GRANTS, MAX_NAME_LENGTH, MAX_RULES } from '#lib/apikeys';

    let { data, form } = $props();

    const id = $props.id();
    const created = $derived(form?.created);
    const tenants = $derived(data.tenants ?? []);
    // The rules of the key. Rules add up: a tenant named by two rules gets the rights of both.
    type Rule = { scopes: SvelteSet<string>; chosen: SvelteSet<string> };
    const empty = (): Rule => ({ scopes: new SvelteSet(), chosen: new SvelteSet() });
    // After a refused submission the page starts from what was sent.
    let rules = $state<Rule[]>(
        untrack(() =>
            form?.values?.rules?.length
                ? form.values.rules.map((r) => ({
                      scopes: new SvelteSet<string>(r.scopes),
                      chosen: new SvelteSet<string>(r.tenants)
                  }))
                : [empty()]
        )
    );
    const covered = $derived(new Set(rules.flatMap((r) => [...r.chosen])));
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

            <div class="flex flex-col gap-3">
                <p class="field-label">What it may do, on which tenants</p>
                <noscript>
                    <Alert tone="warning">This form needs JavaScript to choose the tenants.</Alert>
                </noscript>
                {#if tenants.length === 0}
                    <Alert tone="info"
                        >You are not in a tenant yet: there is nothing to give a key.</Alert
                    >
                {:else}
                    {#each rules as rule, index (rule)}
                        <GrantRule
                            {index}
                            scopes={rule.scopes}
                            chosen={rule.chosen}
                            {tenants}
                            removable={rules.length > 1}
                            onremove={() => rules.splice(index, 1)}
                        />
                    {/each}
                    <div class="flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            class="btn-secondary"
                            disabled={rules.length >= MAX_RULES}
                            onclick={() => rules.push(empty())}
                        >
                            <Plus size={16} aria-hidden="true" />
                            Add a rule
                        </button>
                        <span
                            class="tnum text-sm {covered.size > MAX_GRANTS
                                ? 'font-semibold text-bad-fg'
                                : 'text-fg-3'}"
                            role="status"
                        >
                            {covered.size} of {MAX_GRANTS} tenants covered
                        </span>
                    </div>
                    <p class="help">
                        Rules add up. A right to change does not let the key see: tick both if it
                        needs both. A key covers {MAX_GRANTS} tenants at most; for more, make another
                        key.
                    </p>
                {/if}
            </div>

            <div class="flex flex-wrap items-center gap-3">
                <button type="submit" class="btn-primary" disabled={tenants.length === 0}
                    >Create the key</button
                >
                <a href="/api-keys" class="btn-ghost">Cancel</a>
            </div>
        </form>
    {/if}
</main>
