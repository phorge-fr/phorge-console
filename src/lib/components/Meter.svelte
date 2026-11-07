<script lang="ts">
    // What is used of a quota, as a number and as a bar. The state is in the words ("2 of 2") and the bar changes with it: it turns
    // amber from 80% and red when the quota is reached, so that nothing relies on color alone.
    let {
        label,
        used,
        total,
        unit = ''
    }: { label: string; used: number; total: number; unit?: string } = $props();

    const ratio = $derived(total > 0 ? Math.min(used / total, 1) : 0);
    const level = $derived(used >= total ? 'full' : used / total >= 0.8 ? 'high' : 'ok');
    const fill = { ok: 'bg-primary', high: 'bg-warn-dot', full: 'bg-bad-dot' };
    const note = { ok: '', high: 'Almost full', full: 'Quota reached' };
    const round = (n: number) => Math.round(n * 10) / 10;
</script>

<div>
    <div class="flex items-baseline justify-between gap-3">
        <span class="text-sm font-semibold">{label}</span>
        <span class="tnum text-sm text-fg-2">
            <span class="font-semibold text-fg">{round(used)}</span>
            of {total}{unit ? ` ${unit}` : ''}
        </span>
    </div>
    <div
        class="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2"
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={Math.min(used, total)}
    >
        <div
            class="h-full rounded-full transition-[width] duration-300 {fill[level]}"
            style="width: {ratio * 100}%"
        ></div>
    </div>
    {#if note[level]}
        <p class="mt-1 text-sm {level === 'full' ? 'text-bad-fg' : 'text-warn-fg'}">
            {note[level]}
        </p>
    {/if}
</div>
