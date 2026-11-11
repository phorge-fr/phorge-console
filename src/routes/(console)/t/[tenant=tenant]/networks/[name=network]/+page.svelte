<script lang="ts">
    import Alert from '#lib/components/Alert.svelte';
    import AutoRefresh from '#lib/components/AutoRefresh.svelte';
    import PageHeader from '#lib/components/PageHeader.svelte';
    import PhaseBadge from '#lib/components/PhaseBadge.svelte';
    import SettingsSection from '#lib/components/SettingsSection.svelte';
    import { IPV4_HELP, IPV6_HELP, MAX_NETWORK_DESCRIPTION_LENGTH } from '#lib/networks';

    let { data, form } = $props();

    const id = $props.id();
    const network = $derived(data.network);
    const list = $derived(`/t/${data.tenant.name}/networks`);
    // What was typed when the API refused it, otherwise what the network has.
    const values = $derived(
        form?.values ?? {
            description: network.description ?? '',
            ipv4: network.ipv4 ?? '',
            ipv6: network.ipv6 ?? ''
        }
    );
    // The page follows a network that is being deployed, changed or deleted.
    const busy = $derived(network.phase === 'Provisioning' || network.phase === 'Deleting');
</script>

<svelte:head>
    <title
        >{network.name} · Networks · {data.tenant.displayName || data.tenant.name} · Phorge console</title
    >
</svelte:head>

<AutoRefresh active={busy} />

<main class="mx-auto w-full max-w-5xl px-4 py-8 md:px-10">
    <PageHeader title={network.name} back={{ href: list, label: 'All networks' }}>
        {#snippet status()}
            <PhaseBadge phase={network.phase} />
        {/snippet}
    </PageHeader>

    {#if network.problems}
        <div class="mb-8 max-w-xl">
            <Alert tone="danger" title="What is wrong">{network.problems}</Alert>
        </div>
    {/if}

    <SettingsSection
        title="Overview"
        description="The addresses of the virtual machines of this network are in its ranges."
    >
        <dl class="grid grid-cols-[max-content_minmax(0,1fr)] gap-x-8 gap-y-3">
            <dt class="text-fg-3">IPv4 range</dt>
            <dd class="font-mono">{network.ipv4 ?? '—'}</dd>
            <dt class="text-fg-3">IPv6 range</dt>
            <dd class="font-mono">{network.ipv6 ?? '—'}</dd>
            <dt class="text-fg-3">Created</dt>
            <dd>
                <time datetime={network.createdAt}
                    >{new Date(network.createdAt).toLocaleString('en-GB', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                        timeZone: 'UTC'
                    })} UTC</time
                >
                {#if network.createdBy}<span class="text-fg-2">by {network.createdBy}</span>{/if}
            </dd>
        </dl>
    </SettingsSection>

    {#if network.phase !== 'Deleting'}
        <SettingsSection
            title="Settings"
            description="What you leave as it is does not change. A range that the network has cannot be removed."
        >
            {#if form?.message}
                <div class="mb-5 max-w-xl"><Alert tone="danger">{form.message}</Alert></div>
            {:else if form?.saved}
                <div class="mb-5 max-w-xl">
                    <Alert tone="info"
                        >Saved. The platform applies the change in a few seconds.</Alert
                    >
                </div>
            {/if}
            <form method="POST" class="flex max-w-xl flex-col gap-6">
                <div class="flex flex-col gap-1.5">
                    <label for="{id}-description" class="field-label">Description</label>
                    <input
                        id="{id}-description"
                        name="description"
                        maxlength={MAX_NETWORK_DESCRIPTION_LENGTH}
                        value={values.description}
                        autocomplete="off"
                        class="field"
                        aria-describedby="{id}-description-help"
                    />
                    <p id="{id}-description-help" class="help">Empty removes it.</p>
                </div>

                <div class="flex flex-col gap-1.5">
                    <label for="{id}-ipv4" class="field-label">IPv4 range</label>
                    <input
                        id="{id}-ipv4"
                        name="ipv4"
                        maxlength="18"
                        value={values.ipv4}
                        autocomplete="off"
                        spellcheck="false"
                        placeholder={network.ipv4 ? undefined : 'Chosen by the platform'}
                        class="field max-w-48 font-mono"
                        aria-describedby="{id}-ipv4-help"
                    />
                    <p id="{id}-ipv4-help" class="help">
                        {IPV4_HELP} Changing it is refused while a virtual machine runs on the network:
                        the message says which ones. Stop them from their page, change the range, then
                        start them again. The console never stops a machine for you.
                    </p>
                </div>

                <div class="flex flex-col gap-1.5">
                    <label for="{id}-ipv6" class="field-label">IPv6 range</label>
                    <input
                        id="{id}-ipv6"
                        name="ipv6"
                        maxlength="43"
                        value={values.ipv6}
                        autocomplete="off"
                        spellcheck="false"
                        placeholder={network.ipv6 ? undefined : 'Chosen by the platform'}
                        class="field max-w-72 font-mono"
                        aria-describedby="{id}-ipv6-help"
                    />
                    <p id="{id}-ipv6-help" class="help">
                        {IPV6_HELP} It can change while machines run: they learn it within a minute.
                    </p>
                </div>

                <div class="flex flex-wrap items-center gap-3">
                    <button type="submit" class="btn-primary">Save the network</button>
                    <a href={list} class="btn-ghost">Back to the networks</a>
                </div>
            </form>
        </SettingsSection>
    {/if}
</main>
