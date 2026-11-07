<script lang="ts">
    import { page } from '$app/state';

    // What went wrong, in plain words, with a way out. The text of the API's own answer is in page.error.message.
    const title = $derived(
        page.status === 403
            ? 'You are not allowed to do this'
            : page.status === 404
              ? 'Not found'
              : page.status === 503
                ? 'Temporarily unavailable'
                : 'Something went wrong'
    );
</script>

<svelte:head>
    <title>{title} · Phorge console</title>
</svelte:head>

<main class="mx-auto max-w-3xl px-4 py-12">
    <h1 class="text-3xl font-bold">{title}</h1>
    <p class="mt-4 text-xl">{page.error?.message}</p>
    <p class="mt-6 flex flex-wrap gap-x-6 gap-y-2">
        {#if page.status === 503 || page.status >= 500}
            <a href={page.url.pathname + page.url.search} data-sveltekit-reload>Try again</a>
        {/if}
        <a href="/">Your tenants</a>
    </p>
</main>
