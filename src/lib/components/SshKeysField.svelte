<script lang="ts">
    import type { Snippet } from 'svelte';
    import { MAX_SSH_KEYS } from '#lib/instances';

    // The SSH public keys of a creation form, one per line: the field of an instance and of a profile. The text goes to the action
    // as typed, and `parseKeys` and `keysProblem` (`#lib/instances`) read it there. The API checks the keys again.
    let {
        id,
        value = '',
        children
    }: {
        id: string;
        /** What was typed before an error, kept as it is. */
        value?: string;
        /** What the keys are for, said after "One per line, 20 at most." */
        children: Snippet;
    } = $props();
</script>

<div class="flex flex-col gap-1.5">
    <label for="{id}-keys" class="field-label">
        SSH public keys <span class="font-normal text-fg-3">(optional)</span>
    </label>
    <textarea
        id="{id}-keys"
        name="sshPublicKeys"
        rows="3"
        autocomplete="off"
        spellcheck="false"
        placeholder="ssh-ed25519 AAAA… you@laptop"
        class="field h-auto min-h-20 py-2 font-mono text-sm"
        aria-describedby="{id}-keys-help">{value}</textarea
    >
    <p id="{id}-keys-help" class="help">
        One per line, {MAX_SSH_KEYS} at most. {@render children()}
    </p>
</div>
