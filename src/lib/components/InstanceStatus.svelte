<script lang="ts">
    import LoaderCircle from '@lucide/svelte/icons/loader-circle';
    import Play from '@lucide/svelte/icons/play';
    import Square from '@lucide/svelte/icons/square';
    import type { Instance } from '#lib/server/instances';
    import PhaseBadge from './PhaseBadge.svelte';

    // What a person wants to know about a virtual machine is whether it runs, not whether the platform finished making it. Once the
    // instance is ready the badge says what the machine is doing (running, stopped, starting, stopping); the phase of the platform
    // shows only while it is being made, being deleted, or has failed. A state is written and drawn, never a color alone.
    let { instance }: { instance: Pick<Instance, 'phase' | 'state' | 'transition' | 'running'> } =
        $props();

    const label = $derived(
        instance.transition === 'starting'
            ? 'Starting'
            : instance.transition === 'stopping'
              ? 'Stopping'
              : (instance.state ?? (instance.running ? 'Running' : 'Stopped'))
    );
    const tone = $derived(
        instance.transition
            ? 'bg-prog-bg text-prog-fg'
            : label === 'Running'
              ? 'bg-ok-bg text-ok-fg'
              : 'bg-idle-bg text-idle-fg'
    );
</script>

{#if instance.phase !== 'Ready'}
    <PhaseBadge phase={instance.phase} />
{:else}
    <span
        class="inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[0.8125rem] font-semibold leading-none whitespace-nowrap {tone}"
    >
        {#if instance.transition}
            <LoaderCircle size={14} class="animate-spin" aria-hidden="true" />
        {:else if label === 'Running'}
            <Play size={14} aria-hidden="true" />
        {:else}
            <Square size={14} aria-hidden="true" />
        {/if}
        {label}
    </span>
{/if}
