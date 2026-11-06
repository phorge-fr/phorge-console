<script lang="ts">
    let { data } = $props();
</script>

<svelte:head>
    <title>Account · Phorge console</title>
</svelte:head>

<main class="mx-auto max-w-3xl px-4 py-12">
    <h1 class="text-3xl font-bold">Account</h1>

    <dl class="mt-8 grid grid-cols-[max-content_1fr] gap-x-6 gap-y-3">
        <dt class="text-muted">Signed in as</dt>
        <dd class="font-semibold">{data.user.name ?? data.user.email}</dd>
        <dt class="text-muted">Email</dt>
        <dd>{data.identity.email ?? data.user.email}</dd>
        <dt class="text-muted">Identity</dt>
        <dd class="font-mono">{data.identity.subject}</dd>
        <dt class="text-muted">Role</dt>
        <dd>{data.identity.platformAdmin ? 'Platform administrator' : 'User'}</dd>
    </dl>

    <form method="POST" action="/logout" class="mt-10">
        <button
            type="submit"
            class="cursor-pointer rounded border border-accent bg-surface px-5 py-2 font-semibold text-fg"
        >
            Sign out
        </button>
    </form>
</main>
