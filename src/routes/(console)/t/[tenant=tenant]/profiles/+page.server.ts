import { listProfiles } from '#lib/server/profiles';
import type { PageServerLoad } from './$types';

// Anybody with a role on the tenant reads the profiles. The list is read-only: a profile is opened, and deleted, from its page.
export const load: PageServerLoad = async (event) => ({
    profiles: await listProfiles(event, event.params.tenant)
});
