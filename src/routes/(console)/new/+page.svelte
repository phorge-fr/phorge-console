<script lang="ts">
    import Alert from '#lib/components/Alert.svelte';
    import PageHeader from '#lib/components/PageHeader.svelte';

    let { form } = $props();

    const id = $props.id();
    // What the person typed since the page came, else what the server sent back with an error.
    let typed = $state<string>();
    const name = $derived(typed ?? form?.values?.name ?? '');

    // The rules of the name, said as the person types: the first one that is not met. The API checks it all again.
    const problem = $derived.by(() => {
        if (!name) return '';
        if (!/^[a-z]/.test(name)) return 'Start with a lowercase letter.';
        if (/[^a-z0-9-]/.test(name)) return 'Use only lowercase letters, digits and hyphens.';
        if (name.length < 2) return 'Use at least 2 characters.';
        if (name.length > 28) return 'Use 28 characters at most.';
        return '';
    });
</script>

<svelte:head>
    <title>New tenant · Phorge console</title>
</svelte:head>

<main class="mx-auto w-full max-w-5xl px-4 py-8 md:px-10">
    <PageHeader
        title="New tenant"
        subtitle="A space with its own quota, images, virtual machines and members. It takes about a minute to be made."
        back={{ href: '/', label: 'All tenants' }}
    />

    <form method="POST" class="flex max-w-xl flex-col gap-6">
        {#if form?.message}
            <Alert tone="danger">{form.message}</Alert>
        {/if}

        <div class="flex flex-col gap-1.5">
            <label for="{id}-name" class="field-label">Name</label>
            <input
                id="{id}-name"
                name="name"
                required
                pattern="[a-z][a-z0-9\-]{'{1,27}'}"
                value={form?.values?.name ?? ''}
                oninput={(event) => (typed = event.currentTarget.value)}
                aria-invalid={problem ? 'true' : undefined}
                autocomplete="off"
                autocapitalize="off"
                spellcheck="false"
                class="field max-w-sm font-mono"
                aria-describedby="{id}-name-help"
            />
            <p id="{id}-name-help" class="help">
                The one name of the tenant: in its addresses and the name of its project. It cannot
                change. 2 to 28 lowercase letters, digits or hyphens, starting with a letter.
            </p>
            <p class="min-h-5 text-sm text-warn-fg" aria-live="polite">{problem}</p>
        </div>

        <p class="help">You own the tenant. The number of tenants you can own is limited.</p>

        <div class="flex flex-wrap items-center gap-3">
            <button type="submit" class="btn-primary">Create the tenant</button>
            <a href="/" class="btn-ghost">Cancel</a>
        </div>
    </form>
</main>
