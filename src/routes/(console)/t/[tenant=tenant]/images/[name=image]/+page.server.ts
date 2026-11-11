import { fail, isRedirect, redirect } from '@sveltejs/kit';
import { isConfirmed } from '#lib/server/confirm';
import { deleteImage, getImage } from '#lib/server/images';
import { listInstances } from '#lib/server/instances';
import type { Actions, PageServerLoad } from './$types';

// Anybody with a role on the tenant reads the image; deleting it is for operators and administrators, which the API decides.
export const load: PageServerLoad = async (event) => {
    const [image, instances] = await Promise.all([
        getImage(event, event.params.tenant, event.params.name),
        // The API has no "instances of an image": the machines of the tenant are listed and filtered by image. When they cannot be
        // listed the page still shows the image, and says so instead of saying that nothing uses it.
        listInstances(event, event.params.tenant).catch((error) => {
            if (isRedirect(error)) throw error;
            return undefined;
        })
    ]);
    return {
        image,
        users: instances?.filter((instance) => instance.image === image.name)
    };
};

export const actions: Actions = {
    // Delete the image. Nothing happens unless the exact name was typed. The API answers 409 (`in_use`) while a virtual machine
    // starts from the image and names them: its sentence is shown as it is, and the console deletes nothing else for the person.
    delete: async (event) => {
        const name = event.params.name;
        if (!isConfirmed(await event.request.formData(), name))
            return fail(400, { remove: { message: `The name you typed is not ${name}.` } });
        const result = await deleteImage(event, event.params.tenant, name);
        if (result.ok === false)
            return fail(result.status, { remove: { message: result.message } });
        // The image stays, `Deleting`, until it is gone: the list follows it.
        redirect(303, `/t/${event.params.tenant}/images?deleted=${name}`);
    }
};
