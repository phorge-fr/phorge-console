<script lang="ts">
    import ComingNext from '#lib/components/ComingNext.svelte';
    import PageHeader from '#lib/components/PageHeader.svelte';

    let { data } = $props();
</script>

<svelte:head>
    <title>Members · {data.tenant.displayName || data.tenant.name} · Phorge console</title>
</svelte:head>

<main class="mx-auto w-full max-w-5xl px-4 py-8 md:px-10">
    <PageHeader title="Members" subtitle="Who can use this tenant, and with which role." />
    <ComingNext what="The members and the roles of this tenant" issue={15} />
</main>
