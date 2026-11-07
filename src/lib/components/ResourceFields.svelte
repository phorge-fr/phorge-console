<script lang="ts">
    import { LIMITS, type Resource } from '#lib/instances';

    // The CPU, the memory and the disk of a virtual machine, with the limits of the API. Used to create an instance with a custom
    // size and to resize one.
    let {
        values,
        hint
    }: {
        /** What the fields hold. Empty means "the default of the API" when creating. */
        values: Record<Resource, string | number>;
        hint?: string;
    } = $props();

    const id = $props.id();
    const rows: { name: Resource; label: string; unit: string }[] = [
        { name: 'cpu', label: 'vCPU', unit: 'cores' },
        { name: 'memoryMiB', label: 'Memory', unit: 'MiB' },
        { name: 'diskGiB', label: 'Disk', unit: 'GiB' }
    ];
</script>

<div class="grid gap-4 sm:grid-cols-3">
    {#each rows as row (row.name)}
        <div class="flex flex-col gap-1.5">
            <label for="{id}-{row.name}" class="field-label">{row.label}</label>
            <div class="relative">
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
                    class="field tnum pr-14"
                    aria-describedby="{id}-{row.name}-help"
                />
                <span
                    class="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-fg-3"
                    aria-hidden="true">{row.unit}</span
                >
            </div>
            <p id="{id}-{row.name}-help" class="help tnum">
                {LIMITS[row.name].min} to {LIMITS[row.name].max}
            </p>
        </div>
    {/each}
</div>
{#if hint}<p class="help mt-3">{hint}</p>{/if}
