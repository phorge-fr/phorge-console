<script lang="ts">
    import { page } from '$app/state';
</script>

<svelte:head>
    <title>{page.status} · Phorge</title>
</svelte:head>

<main class="mx-auto max-w-3xl px-4 py-12">
    <h1 class="text-3xl font-bold">{page.status}</h1>
    <p class="mt-4 text-xl">{page.error?.message}</p>
    <p class="mt-6"><a href="/">Back to the start</a></p>
</main>
