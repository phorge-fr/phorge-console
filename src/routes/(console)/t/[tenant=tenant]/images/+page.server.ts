import { IMAGE_NAME } from '#lib/images';
import { listImages } from '#lib/server/images';
import type { PageServerLoad } from './$types';

// Anybody with a role on the tenant reads the images; pulling and deleting are for operators and administrators, which the API decides.
export const load: PageServerLoad = async (event) => {
    const images = await listImages(event, event.params.tenant);
    // `?deleted=<name>` is where the deletion of an image sends the person: the list says what became of it, whether the platform
    // still shows it as being deleted or has already removed it.
    const asked = event.url.searchParams.get('deleted') ?? '';
    const deleted = IMAGE_NAME.test(asked)
        ? { name: asked, gone: !images.some((image) => image.name === asked) }
        : undefined;
    return { images, deleted };
};
