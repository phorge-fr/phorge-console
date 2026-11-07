<script lang="ts">
    // The pattern for every destructive action of the console (a tenant, an image, an instance, a key): nothing is deleted by one
    // click. The person opens the panel, reads what goes with it and types the exact name. It is a <details>, so it works without
    // JavaScript, and the form posts to an action of the page that must call isConfirmed() (#lib/server/confirm) before it deletes.
    let {
        name,
        what,
        consequence,
        action = '?/delete'
    }: {
        /** The exact name the person has to type. */
        name: string;
        /** "tenant", "image", ... in the person's words. */
        what: string;
        /** What goes with it, in plain words. */
        consequence: string;
        action?: string;
    } = $props();

    const id = $props.id();
    // The name is typed as it is: the pattern is the name with its special characters escaped.
    const pattern = $derived(name.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&'));
</script>

<details class="rounded border border-fg bg-surface p-4">
    <summary class="cursor-pointer font-semibold">Delete this {what}…</summary>
    <form method="POST" {action} class="mt-4 flex flex-col gap-3">
        <p>{consequence}</p>
        <p class="font-semibold">This cannot be undone.</p>
        <label for="{id}-confirm">
            Type <code class="rounded bg-highlight px-1 font-mono">{name}</code> to confirm
        </label>
        <input
            id="{id}-confirm"
            name="confirm"
            required
            {pattern}
            autocomplete="off"
            autocapitalize="off"
            spellcheck="false"
            class="max-w-sm rounded border border-accent bg-bg px-3 py-2 font-mono text-fg"
        />
        <div>
            <button
                type="submit"
                class="cursor-pointer rounded border-2 border-fg bg-bg px-5 py-2 font-semibold text-fg"
            >
                Delete the {what}
            </button>
        </div>
    </form>
</details>
