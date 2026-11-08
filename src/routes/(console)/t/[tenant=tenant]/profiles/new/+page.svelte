<script lang="ts">
    import Alert from '#lib/components/Alert.svelte';
    import PageHeader from '#lib/components/PageHeader.svelte';
    import ResourceFields from '#lib/components/ResourceFields.svelte';
    import {
        MAX_PROFILE_DESCRIPTION_LENGTH,
        MAX_PROFILE_NAME_LENGTH,
        PROFILE_NAME_PATTERN
    } from '#lib/profiles';

    let { data, form } = $props();

    const id = $props.id();
    const list = $derived(`/t/${data.tenant.name}/profiles`);
</script>

<svelte:head>
    <title>Create a profile · {data.tenant.displayName || data.tenant.name} · Phorge console</title>
</svelte:head>

<main class="mx-auto w-full max-w-5xl px-4 py-8 md:px-10">
    <PageHeader
        title="Create a profile"
        subtitle="A size your virtual machines can take: the vCPU, the memory and the disk, all three."
        back={{ href: list, label: 'Profiles' }}
    />

    <form method="POST" class="flex max-w-xl flex-col gap-6">
        {#if form?.message}
            <Alert tone="danger">{form.message}</Alert>
        {/if}

        <div class="flex flex-col gap-1.5">
            <label for="{id}-name" class="field-label">Name</label>
            <input
                id="{id}-name"
                name="name"
                required
                maxlength={MAX_PROFILE_NAME_LENGTH}
                pattern={PROFILE_NAME_PATTERN}
                value={form?.values?.name ?? ''}
                autocomplete="off"
                autocapitalize="off"
                spellcheck="false"
                placeholder="web"
                class="field max-w-64 font-mono"
                aria-describedby="{id}-name-help"
            />
            <p id="{id}-name-help" class="help">
                1 to {MAX_PROFILE_NAME_LENGTH} characters: lowercase letters, digits and hyphens, starting
                with a letter. s, m, l and default are taken. It cannot change.
            </p>
        </div>

        <div class="flex flex-col gap-1.5">
            <label for="{id}-description" class="field-label">
                Description <span class="font-normal text-fg-3">(optional)</span>
            </label>
            <input
                id="{id}-description"
                name="description"
                maxlength={MAX_PROFILE_DESCRIPTION_LENGTH}
                value={form?.values?.description ?? ''}
                autocomplete="off"
                class="field"
            />
        </div>

        <fieldset class="m-0 flex min-w-0 flex-col gap-3 border-0 p-0">
            <legend class="field-label mb-2 p-0">Size</legend>
            <ResourceFields
                values={{
                    cpu: form?.values?.cpu ?? '',
                    memoryMiB: form?.values?.memoryMiB ?? '',
                    diskGiB: form?.values?.diskGiB ?? ''
                }}
                hint="The plan of the tenant limits what its machines hold in all. A profile bigger than the plan is made, but a machine that asks for it is refused."
            />
        </fieldset>

        <div class="flex flex-wrap items-center gap-3">
            <button type="submit" class="btn-primary">Create the profile</button>
            <a href={list} class="btn-ghost">Cancel</a>
        </div>
    </form>
</main>
