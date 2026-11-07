<script lang="ts">
    import type { Phase } from '#lib/server/tenants';

    let { phase }: { phase?: Phase } = $props();

    // The state is always written out: it never depends on a colour. The brand has no status colours, so the badges differ by their
    // outline and a mark.
    const marks: Record<Phase, string> = {
        Ready: '✓',
        Provisioning: '…',
        Failed: '!',
        Deleting: '…'
    };
</script>

{#if phase}
    <span
        class="inline-flex items-center gap-1 rounded border px-2 py-0.5 text-sm font-semibold {phase ===
        'Failed'
            ? 'border-2 border-fg'
            : 'border-accent'}"
    >
        <span aria-hidden="true">{marks[phase]}</span>
        {phase}
    </span>
{/if}
