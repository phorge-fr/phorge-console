import { API_URL, OIDC_CLIENT_ID, OIDC_CLIENT_SECRET, OIDC_ISSUER } from '$app/env/private';

export type Config = {
    /** Authentik issuer of the console application, `https://.../application/o/<slug>/`. */
    issuer: string;
    clientId: string;
    /** Only a confidential client has one. Without it the console is a public client: PKCE, no secret. */
    clientSecret: string | undefined;
    /** Base URL of the Phorge API, without a trailing slash. */
    apiUrl: string;
};

/**
 * The settings of the sign-in and of the API client, read from the environment.
 * Returns undefined when one of the issuer, the client id and the API address is missing (the secret is optional): the console then answers 503.
 */
export function getConfig(): Config | undefined {
    if (!OIDC_ISSUER || !OIDC_CLIENT_ID || !API_URL) return undefined;
    return {
        issuer: OIDC_ISSUER,
        clientId: OIDC_CLIENT_ID,
        clientSecret: OIDC_CLIENT_SECRET,
        apiUrl: API_URL.replace(/\/+$/, '')
    };
}
