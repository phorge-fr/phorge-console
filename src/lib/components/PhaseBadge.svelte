<script lang="ts">
    import CircleCheck from '@lucide/svelte/icons/circle-check';
    import CircleX from '@lucide/svelte/icons/circle-x';
    import LoaderCircle from '@lucide/svelte/icons/loader-circle';
    import type { Phase } from '#lib/server/tenants';

    let { phase }: { phase?: Phase } = $props();

    // The state is always written out and drawn: it never depends on a color alone. Success, in progress, failure and the end of
    // life each have their own tint and icon, at the contrast of the tokens.
    const tones: Record<Phase, string> = {
        Ready: 'bg-ok-bg text-ok-fg',
        Provisioning: 'bg-prog-bg text-prog-fg',
        Failed: 'bg-bad-bg text-bad-fg',
        Deleting: 'bg-idle-bg text-idle-fg'
    };
</script>

{#if phase}
    <span
        class="inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[0.8125rem] font-semibold leading-none whitespace-nowrap {tones[
            phase
        ]}"
    >
        {#if phase === 'Ready'}
            <CircleCheck size={14} aria-hidden="true" />
        {:else if phase === 'Failed'}
            <CircleX size={14} aria-hidden="true" />
        {:else}
            <LoaderCircle size={14} class="animate-spin" aria-hidden="true" />
        {/if}
        {phase}
    </span>
{/if}
