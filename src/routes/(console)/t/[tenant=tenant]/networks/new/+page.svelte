<script lang="ts">
    import Alert from '#lib/components/Alert.svelte';
    import PageHeader from '#lib/components/PageHeader.svelte';
    import {
        MAX_NETWORK_DESCRIPTION_LENGTH,
        MAX_NETWORK_NAME_LENGTH,
        NETWORK_NAME_PATTERN
    } from '#lib/networks';

    let { data, form } = $props();

    const id = $props.id();
    const list = $derived(`/t/${data.tenant.name}/networks`);
</script>

<svelte:head>
    <title>Create a network · {data.tenant.displayName || data.tenant.name} · Phorge console</title>
</svelte:head>

<main class="mx-auto w-full max-w-5xl px-4 py-8 md:px-10">
    <PageHeader
        title="Create a network"
        subtitle="Your virtual machines are attached to it. You can choose its addresses, or let the platform choose."
        back={{ href: list, label: 'Networks' }}
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
                maxlength={MAX_NETWORK_NAME_LENGTH}
                pattern={NETWORK_NAME_PATTERN}
                value={form?.values?.name ?? ''}
                autocomplete="off"
                autocapitalize="off"
                spellcheck="false"
                placeholder="net"
                class="field max-w-48 font-mono"
                aria-describedby="{id}-name-help"
            />
            <p id="{id}-name-help" class="help">
                1 to {MAX_NETWORK_NAME_LENGTH} characters: lowercase letters, digits and hyphens, starting
                with a letter. It cannot change.
            </p>
        </div>

        <div class="flex flex-col gap-1.5">
            <label for="{id}-description" class="field-label">
                Description <span class="font-normal text-fg-3">(optional)</span>
            </label>
            <input
                id="{id}-description"
                name="description"
                maxlength={MAX_NETWORK_DESCRIPTION_LENGTH}
                value={form?.values?.description ?? ''}
                autocomplete="off"
                class="field"
            />
        </div>

        <div class="flex flex-col gap-1.5">
            <label for="{id}-ipv4" class="field-label">
                Address range <span class="font-normal text-fg-3">(optional)</span>
            </label>
            <input
                id="{id}-ipv4"
                name="ipv4"
                inputmode="decimal"
                maxlength="18"
                value={form?.values?.ipv4 ?? ''}
                autocomplete="off"
                spellcheck="false"
                placeholder="10.77.1.0/24"
                class="field max-w-48 font-mono"
                aria-describedby="{id}-ipv4-help"
            />
            <p id="{id}-ipv4-help" class="help">
                A private range, from /16 to /29, written as its network address, like 10.77.1.0/24.
                Leave it empty and the platform chooses one. It cannot change.
            </p>
        </div>

        <div class="flex flex-wrap items-center gap-3">
            <button type="submit" class="btn-primary">Create the network</button>
            <a href={list} class="btn-ghost">Cancel</a>
        </div>
    </form>
</main>
