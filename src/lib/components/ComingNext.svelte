<script lang="ts">
    // A view that is not built yet says so, instead of looking empty: what it will hold is in the issue.
    let { what, issue }: { what: string; issue: number } = $props();
</script>

<section class="rounded border border-dashed border-accent bg-surface p-8">
    <h2 class="text-xl font-semibold">Not available yet</h2>
    <p class="mt-3 text-muted">
        {what} will be managed here. Until then, use the Phorge API or the command line.
    </p>
    <p class="mt-3 text-sm text-muted">
        Tracked in
        <a href="https://github.com/phorge-fr/phorge-console/issues/{issue}"
            >phorge-console#{issue}</a
        >.
    </p>
</section>
