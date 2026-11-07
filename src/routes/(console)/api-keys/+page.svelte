<script lang="ts">
    import ComingNext from '#lib/components/ComingNext.svelte';
    import PageHeader from '#lib/components/PageHeader.svelte';
</script>

<svelte:head>
    <title>API keys · Phorge console</title>
</svelte:head>

<main class="mx-auto w-full max-w-5xl px-4 py-8 md:px-10">
    <PageHeader
        title="API keys"
        subtitle="Keys let a script or a program use the Phorge API as you."
    />
    <ComingNext what="Your API keys" issue={18} />
</main>
