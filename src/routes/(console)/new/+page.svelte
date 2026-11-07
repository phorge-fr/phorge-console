<script lang="ts">
    import { PLANS } from '#lib/plans';

    let { data, form } = $props();

    const id = $props.id();
    const field = 'rounded border border-accent bg-bg px-3 py-2 text-fg';
</script>

<svelte:head>
    <title>New tenant · Phorge console</title>
</svelte:head>

<main class="mx-auto max-w-2xl px-4 py-8">
    <h1 class="text-3xl font-bold">New tenant</h1>
    <p class="mt-3 text-muted">
        A tenant is a space with its own quota, images, virtual machines and members. It takes about
        a minute to be made.
    </p>

    {#if form?.message}
        <p role="alert" class="mt-6 rounded border-2 border-fg bg-surface p-4">{form.message}</p>
    {/if}

    <form method="POST" class="mt-6 flex flex-col gap-5">
        <div class="flex flex-col gap-1">
            <label for="{id}-name" class="font-semibold">Name</label>
            <input
                id="{id}-name"
                name="name"
                required
                pattern="[a-z][a-z0-9\-]{'{1,27}'}"
                value={form?.values?.name ?? ''}
                autocomplete="off"
                autocapitalize="off"
                spellcheck="false"
                class="{field} max-w-sm font-mono"
                aria-describedby="{id}-name-help"
            />
            <p id="{id}-name-help" class="text-sm text-muted">
                It is in the addresses and cannot change: 2 to 28 lowercase letters, digits or
                hyphens, starting with a letter.
            </p>
        </div>

        <div class="flex flex-col gap-1">
            <label for="{id}-display" class="font-semibold">Display name (optional)</label>
            <input
                id="{id}-display"
                name="displayName"
                maxlength="100"
                value={form?.values?.displayName ?? ''}
                class="{field} max-w-md"
            />
        </div>

        <div class="flex flex-col gap-1">
            <label for="{id}-owner" class="font-semibold">Owner</label>
            <input
                id="{id}-owner"
                name="owner"
                type="email"
                required
                value={form?.values?.owner ?? data.owner}
                class="{field} max-w-md"
                aria-describedby="{id}-owner-help"
            />
            <p id="{id}-owner-help" class="text-sm text-muted">
                The email of the owner, exactly as it is in Authentik (capitals included). The owner
                is an administrator of the tenant and cannot change.
            </p>
        </div>

        <fieldset class="flex flex-col gap-2 border-0 p-0">
            <legend class="font-semibold">Plan</legend>
            {#each Object.entries(PLANS) as [plan, quota] (plan)}
                <label class="flex items-start gap-3 rounded border border-accent bg-surface p-3">
                    <input
                        type="radio"
                        name="plan"
                        value={plan}
                        required
                        checked={(form?.values?.plan ?? 'small') === plan}
                        class="mt-1"
                    />
                    <span>
                        <strong>{plan}</strong>
                        <span class="block text-muted">
                            {quota.instances}
                            {quota.instances === 1 ? 'VM' : 'VMs'}, {quota.vcpu} vCPU, {quota.memoryGiB}
                            GiB of memory, {quota.diskGiB} GiB of disk, {quota.networks}
                            {quota.networks === 1 ? 'network' : 'networks'}
                        </span>
                    </span>
                </label>
            {/each}
        </fieldset>

        <div class="flex flex-wrap items-center gap-4">
            <button
                type="submit"
                class="cursor-pointer rounded bg-primary px-5 py-2 font-semibold text-on-primary"
                >Create the tenant</button
            >
            <a href="/">Cancel</a>
        </div>
    </form>
</main>
