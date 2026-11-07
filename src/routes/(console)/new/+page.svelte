<script lang="ts">
    import Alert from '#lib/components/Alert.svelte';
    import PageHeader from '#lib/components/PageHeader.svelte';
    import PlanPicker from '#lib/components/PlanPicker.svelte';

    let { data, form } = $props();

    const id = $props.id();
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
                autocomplete="off"
                autocapitalize="off"
                spellcheck="false"
                class="field max-w-sm font-mono"
                aria-describedby="{id}-name-help"
            />
            <p id="{id}-name-help" class="help">
                In the addresses, and it cannot change. 2 to 28 lowercase letters, digits or
                hyphens, starting with a letter.
            </p>
        </div>

        <div class="flex flex-col gap-1.5">
            <label for="{id}-display" class="field-label">
                Display name <span class="font-normal text-fg-3">(optional)</span>
            </label>
            <input
                id="{id}-display"
                name="displayName"
                maxlength="100"
                value={form?.values?.displayName ?? ''}
                class="field max-w-md"
            />
        </div>

        <div class="flex flex-col gap-1.5">
            <label for="{id}-owner" class="field-label">Owner</label>
            <input
                id="{id}-owner"
                name="owner"
                type="email"
                required
                value={form?.values?.owner ?? data.owner}
                class="field max-w-md"
                aria-describedby="{id}-owner-help"
            />
            <p id="{id}-owner-help" class="help">
                The email of the owner, exactly as it is in Authentik (capitals included). The owner
                is an administrator of the tenant and cannot change.
            </p>
        </div>

        <PlanPicker selected={form?.values?.plan ?? 'small'} />

        <div class="flex flex-wrap items-center gap-3">
            <button type="submit" class="btn-primary">Create the tenant</button>
            <a href="/" class="btn-ghost">Cancel</a>
        </div>
    </form>
</main>
