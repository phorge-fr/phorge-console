<script lang="ts">
    import { page } from '$app/state';
    import Alert from '#lib/components/Alert.svelte';

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
    const retry = $derived(page.status >= 500);
</script>

<svelte:head>
    <title>{title} · Phorge console</title>
</svelte:head>

<main class="mx-auto w-full max-w-5xl px-4 py-12 md:px-10">
    <h1 class="text-2xl font-bold tracking-tight">{title}</h1>
    <div class="mt-5 max-w-xl">
        <Alert tone={page.status === 404 ? 'info' : 'danger'}>
            {page.error?.message}
        </Alert>
    </div>
    <p class="mt-6 flex flex-wrap gap-3">
        {#if retry}
            <a href={page.url.pathname + page.url.search} data-sveltekit-reload class="btn-primary"
                >Try again</a
            >
        {/if}
        <a href="/" class="btn-secondary">Back to your tenants</a>
    </p>
</main>
