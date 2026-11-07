<script lang="ts">
    import type { Tenant } from '#lib/server/tenants';

    // A plain form: the choice goes through /switch, which keeps the section the person is in, so it works without JavaScript.
    let { tenants, current, section }: { tenants: Tenant[]; current?: string; section: string } =
        $props();

    const id = $props.id();
</script>

<form method="GET" action="/switch" class="flex items-center gap-2">
    <label for="{id}-tenant" class="font-semibold">Tenant</label>
    <input type="hidden" name="section" value={section} />
    <select
        id="{id}-tenant"
        name="tenant"
        class="max-w-48 rounded border border-accent bg-bg px-2 py-1 text-fg"
    >
        {#if !current}
            <option value="" disabled selected>Choose…</option>
        {/if}
        {#each tenants as tenant (tenant.name)}
            <option value={tenant.name} selected={tenant.name === current}>
                {tenant.displayName || tenant.name}
            </option>
        {/each}
    </select>
    <button
        type="submit"
        class="cursor-pointer rounded border border-accent bg-surface px-3 py-1 font-semibold text-fg"
        >Go</button
    >
</form>
