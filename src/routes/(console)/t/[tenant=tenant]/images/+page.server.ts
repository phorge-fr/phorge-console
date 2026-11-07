import { fail, redirect } from '@sveltejs/kit';
import { IMAGE_ALIAS, IMAGE_NAME, MAX_ALIASES } from '#lib/images';
import { isConfirmed } from '#lib/server/confirm';
import { createImage, deleteImage, listImages } from '#lib/server/images';
import type { Actions, PageServerLoad } from './$types';

// Anybody with a role on the tenant reads the images; pulling and deleting are for operators and administrators, which the API decides.
export const load: PageServerLoad = async (event) => {
    const images = await listImages(event, event.params.tenant);
    // `?delete=<image>` asks for the confirmation of a deletion: the page shows it without needing JavaScript.
    const asked = event.url.searchParams.get('delete');
    return {
        images,
        confirm: images.find((image) => image.name === asked && image.phase !== 'Deleting')?.name
    };
};

export const actions: Actions = {
    // Pull an image from the image server. The server is not a choice: the API only allows linuxcontainers.org.
    create: async (event) => {
        const form = await event.request.formData();
        const name = String(form.get('name') ?? '').trim();
        const source = String(form.get('source') ?? '').trim();
        const aliases = [
            ...new Set(
                String(form.get('aliases') ?? '')
                    .split(/[\s,]+/)
                    .filter(Boolean)
            )
        ];
        const values = { name, source, aliases: aliases.join(' ') };

        // What the person can fix is said here, in their words; the API checks it all again.
        if (!IMAGE_NAME.test(name))
            return fail(400, {
                create: {
                    values,
                    message:
                        'The name has lowercase letters, digits and hyphens, and starts and ends with a letter or a digit.'
                }
            });
        if (!source || source.length > 200 || /\s/.test(source))
            return fail(400, {
                create: {
                    values,
                    message:
                        'The source is the name of the image on the server, like debian/13/cloud.'
                }
            });
        if (aliases.length > MAX_ALIASES)
            return fail(400, {
                create: { values, message: `At most ${MAX_ALIASES} aliases.` }
            });
        const badAlias = aliases.find((alias) => !IMAGE_ALIAS.test(alias));
        if (badAlias)
            return fail(400, {
                create: {
                    values,
                    message: `The alias ${badAlias} is not valid: lowercase letters, digits, dots, hyphens and underscores.`
                }
            });

        const result = await createImage(event, event.params.tenant, {
            name,
            source: { name: source },
            ...(aliases.length ? { aliases } : {})
        });
        if (result.ok === false)
            return fail(result.status, { create: { values, message: result.message } });
        // The image exists and is being pulled: the list follows it until it is ready.
        redirect(303, `/t/${event.params.tenant}/images`);
    },

    // Delete an image. Nothing happens unless the exact name was typed. The name comes in the address of the action (`?/delete&image=`).
    delete: async (event) => {
        const image = event.url.searchParams.get('image') ?? '';
        if (!IMAGE_NAME.test(image))
            return fail(400, { remove: { image, message: 'No such image.' } });
        if (!isConfirmed(await event.request.formData(), image))
            return fail(400, {
                remove: { image, message: `The name you typed is not ${image}.` }
            });
        const result = await deleteImage(event, event.params.tenant, image);
        if (result.ok === false)
            return fail(result.status, { remove: { image, message: result.message } });
        redirect(303, `/t/${event.params.tenant}/images`);
    }
};
