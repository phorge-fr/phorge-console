<script lang="ts">
    import Alert from '#lib/components/Alert.svelte';
    import PageHeader from '#lib/components/PageHeader.svelte';
    import ResourceFields from '#lib/components/ResourceFields.svelte';
    import SshKeysField from '#lib/components/SshKeysField.svelte';
    import {
        MAX_PROFILE_DESCRIPTION_LENGTH,
        MAX_PROFILE_NAME_LENGTH,
        PROFILE_NAME_PATTERN,
        SECURE_BOOT_CHOICES
    } from '#lib/profiles';

    let { data, form } = $props();

    const id = $props.id();
    const list = $derived(`/t/${data.tenant.name}/profiles`);
    // What was chosen before an error. Nothing chosen is the empty value: the profile does not say.
    const secureBoot = $derived(form?.values?.secureBoot ?? '');
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

        <fieldset class="m-0 flex min-w-0 flex-col gap-5 border-0 p-0">
            <legend class="field-label mb-1 p-0">For its instances</legend>
            <p class="help -mt-1">
                Optional. An instance that does not say its own takes what the profile says. One
                that does keeps its own, and the keys it gives replace these, they do not add to
                them. They cannot change once the profile is made.
            </p>

            <div class="flex flex-col gap-1.5">
                <label for="{id}-secureboot" class="field-label">UEFI secure boot</label>
                <select
                    id="{id}-secureboot"
                    name="secureBoot"
                    class="field max-w-sm"
                    aria-describedby="{id}-secureboot-help"
                >
                    {#each SECURE_BOOT_CHOICES as choice (choice.value)}
                        <option value={choice.value} selected={secureBoot === choice.value}>
                            {choice.label}
                        </option>
                    {/each}
                </select>
                <p id="{id}-secureboot-help" class="help">
                    Left alone, the profile does not say it. Some cloud images do not boot with it,
                    like <code class="font-mono">alpine/3.22/cloud</code>.
                </p>
            </div>

            <SshKeysField {id} value={form?.values?.sshPublicKeys ?? ''}>
                They are put in the machine when it starts, so the image must be a
                <code class="font-mono">cloud</code> variant.
            </SshKeysField>
        </fieldset>

        <div class="flex flex-wrap items-center gap-3">
            <button type="submit" class="btn-primary">Create the profile</button>
            <a href={list} class="btn-ghost">Cancel</a>
        </div>
    </form>
</main>
