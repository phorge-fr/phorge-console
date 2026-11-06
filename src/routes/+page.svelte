<script lang="ts">
    // The four messages of the brand guide (docs/reference/brand-guide.md, "Positioning").
    const messages = [
        {
            title: 'Transparent',
            text: 'Everything is public, from the network to the console. There are no black boxes.'
        },
        {
            title: 'Auditable',
            text: 'Anyone can read how the platform is built and check it.'
        },
        {
            title: 'Self-hostable',
            text: 'The deployment is reproducible: anyone can re-create the system.'
        },
        {
            title: 'Minimal',
            text: 'Low power consumption and minimal configuration over cleverness.'
        }
    ];
</script>

<svelte:head>
    <title>Phorge, an open-source cloud provider</title>
    <meta
        name="description"
        content="Phorge is an open-source cloud provider where every line of configuration, automation and infrastructure logic is visible, auditable and open to contribution."
    />
</svelte:head>

<main class="mx-auto max-w-5xl px-4 py-12 sm:py-16">
    <section class="max-w-3xl">
        <h1 class="text-4xl font-bold sm:text-5xl">An open-source cloud provider</h1>
        <p class="mt-6 text-xl">
            Phorge is a cloud where every line of configuration, automation and infrastructure logic
            is visible, auditable and open to contribution.
        </p>
        <p class="mt-4 text-muted">
            It is an early-stage project: the foundation is in place, and the ambition is long-term.
        </p>
        <p class="mt-8">
            <a
                href="https://console.phorge.fr"
                class="inline-block rounded bg-primary px-5 py-2 font-semibold text-on-primary no-underline"
                >Open the console</a
            >
        </p>
    </section>

    <section class="mt-16" aria-labelledby="principles">
        <h2 id="principles" class="text-2xl font-bold">What Phorge stands for</h2>
        <ul class="mt-6 grid list-none gap-4 p-0 sm:grid-cols-2">
            {#each messages as message (message.title)}
                <li class="rounded border border-accent bg-surface p-5">
                    <h3 class="text-lg font-semibold">{message.title}</h3>
                    <p class="mt-2 text-muted">{message.text}</p>
                </li>
            {/each}
        </ul>
    </section>
</main>
