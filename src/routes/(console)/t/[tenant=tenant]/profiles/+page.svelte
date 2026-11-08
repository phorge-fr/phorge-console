<script lang="ts">
    import Plus from '@lucide/svelte/icons/plus';
    import Alert from '#lib/components/Alert.svelte';
    import AutoRefresh from '#lib/components/AutoRefresh.svelte';
    import ConfirmDelete from '#lib/components/ConfirmDelete.svelte';
    import PageHeader from '#lib/components/PageHeader.svelte';
    import PhaseBadge from '#lib/components/PhaseBadge.svelte';
    import { describeSize } from '#lib/profiles';

    let { data, form } = $props();

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

    {#if form?.remove?.message}
        <div class="mb-6">
            <Alert tone="danger" title="The profile {form.remove.profile} was not deleted">
                {form.remove.message}
            </Alert>
        </div>
    {/if}

    {#if data.confirm}
        <div class="mb-6">
            <ConfirmDelete
                open
                name={data.confirm}
                what="profile"
                consequence="The deletion is refused while a virtual machine has this profile: move those first. You can make the profile again later."
                action="?/delete&profile={encodeURIComponent(data.confirm)}"
            />
            <p class="mt-2 text-sm"><a href={base}>Cancel</a></p>
        </div>
    {/if}

    <div class="panel overflow-hidden">
        <table class="w-full border-collapse text-left">
            <thead class="sr-only md:table-header-group md:not-sr-only">
                <tr class="border-b border-line bg-surface text-sm text-fg-3">
                    <th scope="col" class="px-4 py-2.5 font-semibold">Profile</th>
                    <th scope="col" class="px-4 py-2.5 font-semibold">Size</th>
                    <th scope="col" class="px-4 py-2.5 font-semibold">State</th>
                    <th scope="col" class="px-4 py-2.5"><span class="sr-only">Actions</span></th>
                </tr>
            </thead>
            <tbody class="block md:table-row-group">
                {#each data.profiles as profile (profile.name)}
                    <tr
                        class="block border-b border-line px-4 py-3 align-top last:border-b-0 md:table-row md:px-0 md:py-0"
                    >
                        <td class="block py-0.5 md:table-cell md:px-4 md:py-3.5">
                            <span class="font-mono font-semibold">{profile.name}</span>
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
                        <td class="block py-1 md:table-cell md:px-4 md:py-3.5">
                            {#if profile.phase}
                                <PhaseBadge phase={profile.phase} />
                            {/if}
                        </td>
                        <td class="block py-1 md:table-cell md:px-4 md:py-3.5 md:text-right">
                            {#if !profile.builtin && profile.phase !== 'Deleting'}
                                <a
                                    href="{base}?delete={encodeURIComponent(profile.name)}"
                                    class="text-sm font-semibold text-fg-2 hover:text-bad-fg"
                                    >Delete<span class="sr-only"> {profile.name}</span></a
                                >
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
