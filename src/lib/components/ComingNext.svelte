<script lang="ts">
    import EmptyState from './EmptyState.svelte';

    // A view that is not built yet says so, instead of looking empty: what it will hold is in the issue.
    let { what, issue }: { what: string; issue: number } = $props();
</script>

<EmptyState title="Not available yet">
    <p>{what} will be managed here. Until then, use the Phorge API or the command line.</p>
    <p class="mt-3 text-sm text-fg-3">
        Tracked in
        <a href="https://github.com/phorge-fr/phorge-console/issues/{issue}"
            >phorge-console#{issue}</a
        >.
    </p>
</EmptyState>
