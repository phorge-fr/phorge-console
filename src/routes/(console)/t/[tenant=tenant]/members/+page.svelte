<script lang="ts">
    import ComingNext from '#lib/components/ComingNext.svelte';

    let { data } = $props();
</script>

<svelte:head>
    <title>Members · {data.tenant.displayName || data.tenant.name} · Phorge console</title>
</svelte:head>

<main class="mx-auto max-w-6xl px-4 py-8">
    <h1 class="text-3xl font-bold">Members</h1>
    <div class="mt-6">
        <ComingNext what="The members and the roles of this tenant" issue={15} />
    </div>
</main>
