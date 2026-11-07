<script lang="ts">
    import Trash from '@lucide/svelte/icons/trash';

    // The pattern for every destructive action of the console (a tenant, an image, an instance, a key): nothing is deleted by one
    // click. The person opens the panel, reads what goes with it and types the exact name. It is a <details>, so it works without
    // JavaScript, and the form posts to an action of the page that must call isConfirmed() (#lib/server/confirm) before it deletes.
    let {
        name,
        what,
        consequence,
        action = '?/delete',
        open = false
    }: {
        /** The exact name the person has to type. */
        name: string;
        /** "tenant", "image", ... in the person's words. */
        what: string;
        /** What goes with it, in plain words. */
        consequence: string;
        action?: string;
        /** Shown open, for a page that was asked to delete this one (`?delete=<name>`). */
        open?: boolean;
    } = $props();

    const id = $props.id();
    // The name is typed as it is: the pattern is the name with its special characters escaped.
    const pattern = $derived(name.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&'));
</script>

<details class="group rounded-lg border border-bad-dot" {open}>
    <summary
        class="flex cursor-pointer list-none items-center gap-2 px-4 py-3 font-semibold text-bad-fg [&::-webkit-details-marker]:hidden"
    >
        <Trash size={16} aria-hidden="true" />
        Delete this {what}…
    </summary>
    <form
        method="POST"
        {action}
        class="flex flex-col gap-4 border-t border-bad-dot bg-bad-bg px-4 py-4"
    >
        <div class="text-fg">
            <p>{consequence}</p>
            <p class="mt-1 font-semibold">This cannot be undone.</p>
        </div>
        <div class="flex flex-col gap-1.5">
            <label for="{id}-confirm" class="field-label">
                Type <code class="rounded bg-bg px-1.5 py-0.5 font-mono text-sm">{name}</code> to confirm
            </label>
            <input
                id="{id}-confirm"
                name="confirm"
                required
                {pattern}
                autocomplete="off"
                autocapitalize="off"
                spellcheck="false"
                class="field max-w-sm font-mono"
            />
        </div>
        <div>
            <button type="submit" class="btn-danger">Delete the {what}</button>
        </div>
    </form>
</details>
