<script lang="ts">
    import ComingNext from '#lib/components/ComingNext.svelte';
</script>

<svelte:head>
    <title>API keys · Phorge console</title>
</svelte:head>

<main class="mx-auto max-w-6xl px-4 py-8">
    <h1 class="text-3xl font-bold">API keys</h1>
    <div class="mt-6">
        <ComingNext what="Your API keys" issue={18} />
    </div>
</main>
