<script lang="ts">
    import ComingNext from '#lib/components/ComingNext.svelte';

    let { data } = $props();
</script>

<svelte:head>
    <title>Images · {data.tenant.displayName || data.tenant.name} · Phorge console</title>
</svelte:head>

<main class="mx-auto max-w-6xl px-4 py-8">
    <h1 class="text-3xl font-bold">Images</h1>
    <div class="mt-6">
        <ComingNext what="The images of this tenant" issue={16} />
    </div>
</main>
