<script lang="ts">
    import Alert from '#lib/components/Alert.svelte';
    import PageHeader from '#lib/components/PageHeader.svelte';
    import Terminal from '#lib/components/Terminal.svelte';

    let { data } = $props();

    const instance = $derived(data.instance);
    const back = $derived(`/t/${data.tenant.name}/instances/${instance.name}`);
    // A comfort check: the API refuses a terminal on a machine that is not running whatever the console shows.
    const running = $derived(instance.phase === 'Ready' && instance.state === 'Running');
</script>

<svelte:head>
    <title
        >Terminal · {instance.name} · {data.tenant.displayName || data.tenant.name} · Phorge console</title
    >
</svelte:head>

<main class="mx-auto w-full max-w-6xl px-4 py-8 md:px-10">
    <PageHeader
        title="Terminal"
        subtitle="A shell as root on {instance.name}, in your browser."
        back={{ href: back, label: instance.name }}
    />

    <noscript>
        <Alert tone="warning">The terminal needs JavaScript.</Alert>
    </noscript>

    {#if running}
        <Terminal tenant={data.tenant.name} name={instance.name} {back} />
    {:else}
        <Alert tone="info" title="This instance is not running">
            A terminal opens on a running instance. Start {instance.name}, wait for it to be
            running, then open the terminal.
        </Alert>
        <p class="mt-4"><a href={back} class="btn-secondary">Back to the instance</a></p>
    {/if}
</main>
