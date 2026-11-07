import { fail, redirect } from '@sveltejs/kit';
import { IMAGE_NAME } from '#lib/images';
import { isConfirmed } from '#lib/server/confirm';
import { deleteImage, listImages } from '#lib/server/images';
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
