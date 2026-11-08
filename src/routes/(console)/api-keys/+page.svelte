<script lang="ts">
    import Plus from '@lucide/svelte/icons/plus';
    import Alert from '#lib/components/Alert.svelte';
    import ConfirmDelete from '#lib/components/ConfirmDelete.svelte';
    import EmptyState from '#lib/components/EmptyState.svelte';
    import PageHeader from '#lib/components/PageHeader.svelte';
    import PhaseBadge from '#lib/components/PhaseBadge.svelte';

    let { data, form } = $props();

    const id = $props.id();
    const keyToRename = $derived(data.keys.find((key) => key.id === data.rename));
    const keyToRevoke = $derived(data.keys.find((key) => key.id === data.revoke));
    const date = (iso: string) =>
        new Date(iso).toLocaleDateString('en-GB', { dateStyle: 'medium', timeZone: 'UTC' });
</script>

<svelte:head>
    <title>API keys · Phorge console</title>
</svelte:head>

<main class="mx-auto w-full max-w-5xl px-4 py-8 md:px-10">
    <PageHeader
        title="API keys"
        subtitle="A key lets a script or a program use the Phorge API with some of your rights, until a date you choose. It cannot do more than you can."
    >
        {#snippet actions()}
            <a href="/api-keys/new" class="btn-primary">
                <Plus size={16} aria-hidden="true" />
                Create a key
            </a>
        {/snippet}
    </PageHeader>

    {#if form?.rename?.message}
        <div class="mb-6">
            <Alert tone="danger" title="The key was not renamed">{form.rename.message}</Alert>
        </div>
    {/if}
    {#if form?.revoke?.message}
        <div class="mb-6">
            <Alert tone="danger" title="The key was not revoked">{form.revoke.message}</Alert>
        </div>
    {/if}

    {#if keyToRename}
        <form
            method="POST"
            action="?/rename&key={encodeURIComponent(keyToRename.id)}"
            class="panel mb-6 flex flex-col gap-3 p-4"
        >
            <label for="{id}-rename" class="field-label"
                >New name for “{keyToRename.displayName}”</label
            >
            <input
                id="{id}-rename"
                name="displayName"
                required
                maxlength="100"
                value={keyToRename.displayName}
                class="field max-w-md"
            />
            <p class="help">Only the name changes. What the key may do and until when are fixed.</p>
            <div class="flex items-center gap-3">
                <button type="submit" class="btn-primary">Rename</button>
                <a href="/api-keys" class="btn-ghost">Cancel</a>
            </div>
        </form>
    {/if}

    {#if keyToRevoke}
        <div class="mb-6">
            <ConfirmDelete
                open
                name={keyToRevoke.displayName}
                what="key"
                consequence="The key stops working at once. A program that uses it will be refused."
                action="?/revoke&key={encodeURIComponent(keyToRevoke.id)}"
            />
            <p class="mt-2 text-sm"><a href="/api-keys">Cancel</a></p>
        </div>
    {/if}

    {#if data.keys.length === 0}
        <EmptyState title="No API key yet">
            <p>
                A key is for a script, a pipeline or a program. You choose what it may do on which
                tenant, and until when.
            </p>
        </EmptyState>
    {:else}
        <div class="panel overflow-hidden">
            <table class="w-full border-collapse text-left">
                <thead class="sr-only md:table-header-group md:not-sr-only">
                    <tr class="border-b border-line bg-surface text-sm text-fg-3">
                        <th scope="col" class="px-4 py-2.5 font-semibold">Name</th>
                        <th scope="col" class="px-4 py-2.5 font-semibold">Can do</th>
                        <th scope="col" class="px-4 py-2.5 font-semibold">Expires</th>
                        <th scope="col" class="px-4 py-2.5"><span class="sr-only">Actions</span></th
                        >
                    </tr>
                </thead>
                <tbody class="block md:table-row-group">
                    {#each data.keys as key (key.id)}
                        <tr
                            class="block border-b border-line px-4 py-3 align-top last:border-b-0 md:table-row md:px-0 md:py-0"
                        >
                            <td class="block py-0.5 md:table-cell md:px-4 md:py-3.5">
                                <span class="font-semibold">{key.displayName}</span>
                                <span class="block font-mono text-sm break-all text-fg-3"
                                    >{key.identity}</span
                                >
                            </td>
                            <td class="block py-0.5 text-sm md:table-cell md:px-4 md:py-3.5">
                                <ul class="m-0 flex list-none flex-col gap-1 p-0">
                                    {#each key.grants as grant (grant.tenant)}
                                        <li class="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                                            <span class="font-mono font-semibold"
                                                >{grant.tenant}</span
                                            >
                                            {#each grant.scopes as scope (scope)}
                                                <code
                                                    class="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-xs text-fg-2"
                                                    >{scope}</code
                                                >
                                            {/each}
                                        </li>
                                    {/each}
                                </ul>
                            </td>
                            <td class="tnum block py-1 text-sm md:table-cell md:px-4 md:py-3.5">
                                {#if key.expired}
                                    <span
                                        class="inline-flex h-6 items-center rounded-full bg-bad-bg px-2.5 text-[0.8125rem] font-semibold text-bad-fg"
                                        >Expired</span
                                    >
                                {:else if key.phase !== 'Ready'}
                                    <PhaseBadge phase={key.phase} />
                                {:else if key.expiresAt}
                                    <time datetime={key.expiresAt}>{date(key.expiresAt)}</time>
                                {/if}
                            </td>
                            <td
                                class="block py-1 text-sm md:table-cell md:px-4 md:py-3.5 md:text-right"
                            >
                                {#if key.phase !== 'Deleting'}
                                    <span class="inline-flex gap-4">
                                        <a
                                            href="/api-keys?rename={encodeURIComponent(key.id)}"
                                            class="font-semibold text-fg-2 hover:text-fg"
                                            >Rename<span class="sr-only">
                                                {key.displayName}</span
                                            ></a
                                        >
                                        <a
                                            href="/api-keys?revoke={encodeURIComponent(key.id)}"
                                            class="font-semibold text-fg-2 hover:text-bad-fg"
                                            >Revoke<span class="sr-only">
                                                {key.displayName}</span
                                            ></a
                                        >
                                    </span>
                                {/if}
                            </td>
                        </tr>
                        {#if key.problems}
                            <tr
                                class="block border-b border-line px-4 pb-3 last:border-b-0 md:table-row md:p-0"
                            >
                                <td colspan="4" class="block md:table-cell md:px-4 md:pb-3.5">
                                    <Alert tone="danger" title="What is wrong">{key.problems}</Alert
                                    >
                                </td>
                            </tr>
                        {/if}
                    {/each}
                </tbody>
            </table>
        </div>
    {/if}
</main>
