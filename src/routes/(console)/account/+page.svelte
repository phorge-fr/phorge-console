<script lang="ts">
    import LogOut from '@lucide/svelte/icons/log-out';
    import PageHeader from '#lib/components/PageHeader.svelte';
    import SettingsSection from '#lib/components/SettingsSection.svelte';

    let { data } = $props();
</script>

<svelte:head>
    <title>Account · Phorge console</title>
</svelte:head>

<main class="mx-auto w-full max-w-5xl px-4 py-8 md:px-10">
    <PageHeader title="Account" />

    <SettingsSection title="Profile" description="The account you are signed in with.">
        <dl class="grid grid-cols-[max-content_minmax(0,1fr)] gap-x-8 gap-y-3">
            <dt class="text-fg-3">Name</dt>
            <dd class="font-semibold">{data.user.name ?? data.user.email}</dd>
            <dt class="text-fg-3">Email</dt>
            <dd class="break-words">{data.identity.email ?? data.user.email}</dd>
            <dt class="text-fg-3">Identity</dt>
            <dd class="font-mono text-sm break-all text-fg-2">{data.identity.subject}</dd>
        </dl>
    </SettingsSection>

    <SettingsSection
        title="Session"
        description="Signing out ends your session here and at Phorge."
    >
        <form method="POST" action="/logout">
            <button type="submit" class="btn-secondary">
                <LogOut size={16} aria-hidden="true" />
                Sign out
            </button>
        </form>
    </SettingsSection>
</main>
