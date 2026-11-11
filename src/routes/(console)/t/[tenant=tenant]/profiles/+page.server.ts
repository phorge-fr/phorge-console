import { PROFILE_NAME } from '#lib/profiles';
import { listProfiles } from '#lib/server/profiles';
import type { PageServerLoad } from './$types';

// Anybody with a role on the tenant reads the profiles. The list is read-only: a profile is opened, and deleted, from its page.
export const load: PageServerLoad = async (event) => {
    const profiles = await listProfiles(event, event.params.tenant);
    // `?deleted=<name>` is where the deletion of a profile sends the person: the list says what became of it, whether the platform
    // still shows it as being deleted or has already removed it.
    const asked = event.url.searchParams.get('deleted') ?? '';
    const deleted = PROFILE_NAME.test(asked)
        ? { name: asked, gone: !profiles.some((profile) => profile.name === asked) }
        : undefined;
    return { profiles, deleted };
};
