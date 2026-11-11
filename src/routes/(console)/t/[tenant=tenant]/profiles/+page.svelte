<script lang="ts">
    import Plus from '@lucide/svelte/icons/plus';
    import Alert from '#lib/components/Alert.svelte';
    import AutoRefresh from '#lib/components/AutoRefresh.svelte';
    import PageHeader from '#lib/components/PageHeader.svelte';
    import PhaseBadge from '#lib/components/PhaseBadge.svelte';
    import { describeSize } from '#lib/profiles';

    let { data } = $props();

    // A list that follows what is being made or deleted.
    const busy = $derived(
        data.profiles.some(
            (profile) => profile.phase === 'Provisioning' || profile.phase === 'Deleting'
        )
    );
    const base = $derived(`/t/${data.tenant.name}/profiles`);
</script>

<svelte:head>
    <title>Profiles · {data.tenant.displayName || data.tenant.name} · Phorge console</title>
</svelte:head>

<AutoRefresh active={busy} />

<main class="mx-auto w-full max-w-5xl px-4 py-8 md:px-10">
    <PageHeader
        title="Profiles"
        subtitle="The sizes your virtual machines can take. Every tenant has s, m and l; you can make your own. A profile cannot be changed: to change one, make another and move your machines to it."
    >
        {#snippet actions()}
            <a href="{base}/new" class="btn-primary">
                <Plus size={16} aria-hidden="true" />
                Create a profile
            </a>
        {/snippet}
    </PageHeader>

    {#if data.deleted}
        <div class="mb-6">
            <Alert
                tone="info"
                title={data.deleted.gone ? 'Profile deleted' : 'Deleting the profile'}
            >
                {#if data.deleted.gone}
                    <span class="font-mono">{data.deleted.name}</span> is gone.
                {:else}
                    <span class="font-mono">{data.deleted.name}</span> is being deleted. This list follows
                    it until it is gone.
                {/if}
            </Alert>
        </div>
    {/if}

    <div class="panel overflow-hidden">
        <table class="w-full border-collapse text-left">
            <thead class="sr-only md:table-header-group md:not-sr-only">
                <tr class="border-b border-line bg-surface text-sm text-fg-3">
                    <th scope="col" class="px-4 py-2.5 font-semibold">Name</th>
                    <th scope="col" class="px-4 py-2.5 font-semibold">Size</th>
                    <th scope="col" class="px-4 py-2.5 font-semibold">Settings</th>
                    <th scope="col" class="px-4 py-2.5 font-semibold">State</th>
                </tr>
            </thead>
            <tbody class="block md:table-row-group">
                {#each data.profiles as profile (profile.name)}
                    <!-- A profile that says nothing shows nothing (and no gap on a phone): the mark is for the ones that do. -->
                    {@const says =
                        profile.secureBoot !== undefined || !!profile.sshPublicKeys?.length}
                    <tr
                        class="relative block border-b border-line px-4 py-3 align-top last:border-b-0 hover:bg-surface md:table-row md:px-0 md:py-0"
                    >
                        <td class="block py-0.5 md:table-cell md:px-4 md:py-3.5">
                            <a
                                href="{base}/{profile.name}"
                                class="font-mono font-semibold text-fg no-underline after:absolute after:inset-0 after:content-['']"
                                >{profile.name}</a
                            >
                            {#if profile.builtin}
                                <span class="ml-2 text-sm text-fg-3">Built in</span>
                            {/if}
                            {#if profile.description}
                                <span class="block text-sm text-fg-3">{profile.description}</span>
                            {/if}
                        </td>
                        <td
                            class="tnum block py-0.5 text-sm text-fg-2 md:table-cell md:px-4 md:py-3.5"
                        >
                            {describeSize(profile)}
                        </td>
                        <td
                            class="{says
                                ? 'block'
                                : 'hidden'} py-0.5 text-sm text-fg-2 md:table-cell md:px-4 md:py-3.5"
                        >
                            {#if says}
                                {#if profile.secureBoot !== undefined}
                                    <span class="block"
                                        >Secure boot {profile.secureBoot ? 'on' : 'off'}</span
                                    >
                                {/if}
                                {#if profile.sshPublicKeys?.length}
                                    <span class="block tnum"
                                        >{profile.sshPublicKeys.length} SSH {profile.sshPublicKeys
                                            .length === 1
                                            ? 'key'
                                            : 'keys'}</span
                                    >
                                {/if}
                            {/if}
                        </td>
                        <td class="block py-1 md:table-cell md:px-4 md:py-3.5">
                            {#if profile.phase}
                                <PhaseBadge phase={profile.phase} />
                            {/if}
                        </td>
                    </tr>
                    {#if profile.problems}
                        <tr
                            class="block border-b border-line px-4 pb-3 last:border-b-0 md:table-row md:p-0"
                        >
                            <td colspan="4" class="block md:table-cell md:px-4 md:pb-3.5">
                                <Alert tone="danger" title="What is wrong">{profile.problems}</Alert
                                >
                            </td>
                        </tr>
                    {/if}
                {/each}
            </tbody>
        </table>
    </div>
</main>
