import { fail, redirect } from '@sveltejs/kit';
import { KEY_ID, MAX_NAME_LENGTH } from '#lib/apikeys';
import { isConfirmed } from '#lib/server/confirm';
import { listApiKeys, renameApiKey, revokeApiKey } from '#lib/server/apikeys';
import type { Actions, PageServerLoad } from './$types';

// The keys of the signed-in person. `?rename=<id>` and `?revoke=<id>` ask for the form of that action, which the page shows without
// needing JavaScript.
export const load: PageServerLoad = async (event) => {
    const keys = await listApiKeys(event);
    const named = (param: string) => {
        const id = event.url.searchParams.get(param) ?? '';
        return keys.find((key) => key.id === id)?.id;
    };
    return { keys, rename: named('rename'), revoke: named('revoke') };
};

export const actions: Actions = {
    // Rename a key: the only change the API allows.
    rename: async (event) => {
        const id = event.url.searchParams.get('key') ?? '';
        const form = await event.request.formData();
        const displayName = String(form.get('displayName') ?? '').trim();
        if (!KEY_ID.test(id)) return fail(400, { rename: { id, message: 'No such key.' } });
        if (!displayName || displayName.length > MAX_NAME_LENGTH)
            return fail(400, {
                rename: { id, message: `The name has 1 to ${MAX_NAME_LENGTH} characters.` }
            });
        const result = await renameApiKey(event, id, displayName);
        if (result.ok === false)
            return fail(result.status, { rename: { id, message: result.message } });
        redirect(303, '/api-keys');
    },

    // Revoke a key: it stops working at once. Nothing happens unless the exact name was typed.
    revoke: async (event) => {
        const id = event.url.searchParams.get('key') ?? '';
        if (!KEY_ID.test(id)) return fail(400, { revoke: { id, message: 'No such key.' } });
        const keys = await listApiKeys(event);
        const key = keys.find((k) => k.id === id);
        if (!key)
            return fail(404, { revoke: { id, message: 'This key does not exist any more.' } });
        if (!isConfirmed(await event.request.formData(), key.displayName))
            return fail(400, {
                revoke: { id, message: `The name you typed is not ${key.displayName}.` }
            });
        const result = await revokeApiKey(event, id);
        if (result.ok === false)
            return fail(result.status, { revoke: { id, message: result.message } });
        redirect(303, '/api-keys');
    }
};
