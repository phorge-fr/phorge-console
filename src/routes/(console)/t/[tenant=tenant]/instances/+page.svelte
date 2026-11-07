<script lang="ts">
    import Plus from '@lucide/svelte/icons/plus';
    import AutoRefresh from '#lib/components/AutoRefresh.svelte';
    import EmptyState from '#lib/components/EmptyState.svelte';
    import PageHeader from '#lib/components/PageHeader.svelte';
    import PhaseBadge from '#lib/components/PhaseBadge.svelte';
    import { describeState } from '#lib/instances';

    let { data } = $props();

    const base = $derived(`/t/${data.tenant.name}/instances`);
    // A list that follows what is being made, started, stopped or deleted.
    const busy = $derived(
        data.instances.some(
            (instance) =>
                instance.phase === 'Provisioning' ||
                instance.phase === 'Deleting' ||
                instance.transition
        )
    );
</script>

<svelte:head>
    <title>Instances · {data.tenant.displayName || data.tenant.name} · Phorge console</title>
</svelte:head>

<AutoRefresh active={busy} />

<main class="mx-auto w-full max-w-5xl px-4 py-8 md:px-10">
    <PageHeader
        title="Instances"
        subtitle="The virtual machines of this tenant, each with its own disk."
    >
        {#snippet actions()}
            <a href="{base}/new" class="btn-primary">
                <Plus size={16} aria-hidden="true" />
                Create an instance
            </a>
        {/snippet}
    </PageHeader>
</main>
