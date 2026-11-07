import { INSTANCE_NAME } from '#lib/instances';
import { listInstances } from '#lib/server/instances';
import type { PageServerLoad } from './$types';

// Anybody with a role on the tenant reads the instances; changing them is for users, operators and administrators, which the API decides.
export const load: PageServerLoad = async (event) => {
    const instances = await listInstances(event, event.params.tenant);
    // `?deleted=<name>` is where the deletion of an instance sends the person: the list says what became of it, whether the platform
    // still shows it as being deleted or has already removed it.
    const asked = event.url.searchParams.get('deleted') ?? '';
    const deleted = INSTANCE_NAME.test(asked)
        ? { name: asked, gone: !instances.some((instance) => instance.name === asked) }
        : undefined;
    return { instances, deleted };
};
