<script lang="ts">
    import { LIMITS, type Resource } from '#lib/instances';

    // The CPU, the memory and the disk of a virtual machine, with the limits of the API. Used to create an instance and to resize it.
    let {
        values,
        hint
    }: {
        /** What the fields hold. Empty means "the default of the API" when creating. */
        values: Record<Resource, string | number>;
        hint?: string;
    } = $props();

    const id = $props.id();
    const field = 'w-32 rounded border border-accent bg-bg px-3 py-2 text-fg';
    const rows: { name: Resource; label: string; unit: string }[] = [
        { name: 'cpu', label: 'vCPU', unit: '' },
        { name: 'memoryMiB', label: 'Memory', unit: 'MiB' },
        { name: 'diskGiB', label: 'Disk', unit: 'GiB' }
    ];
</script>

<div class="flex flex-wrap gap-5">
    {#each rows as row (row.name)}
        <div class="flex flex-col gap-1">
            <label for="{id}-{row.name}" class="font-semibold">{row.label}</label>
            <div class="flex items-center gap-2">
                <input
                    id="{id}-{row.name}"
                    name={row.name}
                    type="number"
                    inputmode="numeric"
                    min={LIMITS[row.name].min}
                    max={LIMITS[row.name].max}
                    step="1"
                    value={values[row.name]}
                    placeholder={String(LIMITS[row.name].default)}
                    class={field}
                    aria-describedby="{id}-{row.name}-help"
                />
                {#if row.unit}<span class="text-muted">{row.unit}</span>{/if}
            </div>
            <p id="{id}-{row.name}-help" class="text-sm text-muted">
                {LIMITS[row.name].min} to {LIMITS[row.name].max}
            </p>
        </div>
    {/each}
</div>
{#if hint}<p class="mt-2 text-sm text-muted">{hint}</p>{/if}
