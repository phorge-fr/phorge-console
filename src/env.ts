import { defineEnvVars } from '@sveltejs/kit/env';

// Optional on purpose: without them the console answers 503 and the showcase site is not affected.
const optional = (value: string | undefined) => (value ? value : undefined);

export const variables = defineEnvVars({
    OIDC_ISSUER: {
        schema: optional,
        description:
            'Authentik issuer of the console application, https://.../application/o/<slug>/'
    },
    OIDC_CLIENT_ID: { schema: optional, description: 'Client id of the console in Authentik' },
    OIDC_CLIENT_SECRET: {
        schema: optional,
        description: 'Client secret of the console in Authentik'
    },
    API_URL: { schema: optional, description: 'Base URL of the Phorge API' }
});
