<script lang="ts">
    import { goto, invalidateAll } from '$app/navigation';

    let { data, children } = $props();

    // A tenant that is being made or deleted is followed: the page asks the console for its state every few seconds and reloads
    // when it changes, and goes home when a tenant that was being deleted is gone. It stops after a quarter of an hour.
    const active = $derived(
        data.tenant.phase === 'Provisioning' || data.tenant.phase === 'Deleting'
    );

    $effect(() => {
        if (!active) return;
        const name = data.tenant.name;
        const seen = { phase: data.tenant.phase ?? null, problems: data.tenant.problems ?? null };
        const started = Date.now();
        let stopped = false;
        const timer = setInterval(async () => {
            if (Date.now() - started > 15 * 60_000) return clearInterval(timer);
            try {
                const response = await fetch(`/t/${name}/status`);
                if (stopped || !response.ok) return;
                const now = await response.json();
                if (now.gone) await goto('/');
                else if (now.phase !== seen.phase || now.problems !== seen.problems)
                    await invalidateAll();
            } catch {
                // The next round tries again.
            }
        }, 4000);
        return () => {
            stopped = true;
            clearInterval(timer);
        };
    });
</script>

{@render children()}
