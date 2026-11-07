<script lang="ts">
    import { invalidateAll } from '$app/navigation';

    // Reloads the data of the page every few seconds while something is being made or deleted, so that the state changes without a
    // manual reload. It stops by itself after a quarter of an hour: a tenant that is still not ready then needs a person.
    let { active, every = 5000 }: { active: boolean; every?: number } = $props();

    $effect(() => {
        if (!active) return;
        const started = Date.now();
        const timer = setInterval(() => {
            if (Date.now() - started > 15 * 60_000) clearInterval(timer);
            else invalidateAll();
        }, every);
        return () => clearInterval(timer);
    });
</script>
