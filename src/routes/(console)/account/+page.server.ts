import { whoami } from '#lib/server/api';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
    // The person as the API sees them: it is what every other call of the console is judged on.
    const identity = await whoami(event);
    return { identity };
};
