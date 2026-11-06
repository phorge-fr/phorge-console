import { dev } from '$app/env';
import * as client from 'openid-client';
import type { Config } from './config';
import type { Session } from './session';

const SCOPE = 'openid email profile offline_access';

let cached: { key: string; config: client.Configuration } | undefined;

/** The discovery document is fetched once per process; a failure is not cached. */
async function oidcConfig(cfg: Config): Promise<client.Configuration> {
    const key = `${cfg.issuer}|${cfg.clientId}`;
    if (cached?.key === key) return cached.config;
    const issuer = new URL(cfg.issuer);
    // Plain HTTP is only accepted by the development server, for a local identity provider.
    if (issuer.protocol !== 'https:' && !dev) throw new Error('OIDC_ISSUER must be an https URL');
    // The secret goes in the Authorization header (client_secret_basic), the default of OpenID Connect.
    const config = await client.discovery(
        issuer,
        cfg.clientId,
        undefined,
        client.ClientSecretBasic(cfg.clientSecret),
        dev ? { execute: [client.allowInsecureRequests] } : undefined
    );
    cached = { key, config };
    return config;
}

export const redirectUri = (origin: string) => `${origin}/oidc/callback`;

/** Builds the address of the sign-in page of Authentik, and what must be remembered for the callback. */
export async function beginLogin(cfg: Config, origin: string, next: string) {
    const config = await oidcConfig(cfg);
    const verifier = client.randomPKCECodeVerifier();
    const state = client.randomState();
    const nonce = client.randomNonce();
    const url = client.buildAuthorizationUrl(config, {
        redirect_uri: redirectUri(origin),
        scope: SCOPE,
        code_challenge: await client.calculatePKCECodeChallenge(verifier),
        code_challenge_method: 'S256',
        state,
        nonce
    });
    return { url, pending: { state, nonce, verifier, next } };
}

/** Checks the answer of Authentik (state, nonce, PKCE, ID token) and exchanges the code for tokens. */
export async function finishLogin(
    cfg: Config,
    callbackUrl: URL,
    pending: { state: string; nonce: string; verifier: string }
): Promise<Omit<Session, 'id' | 'expiresAt'>> {
    const config = await oidcConfig(cfg);
    const tokens = await client.authorizationCodeGrant(config, callbackUrl, {
        pkceCodeVerifier: pending.verifier,
        expectedState: pending.state,
        expectedNonce: pending.nonce,
        idTokenExpected: true
    });
    const claims = tokens.claims();
    const email = typeof claims?.email === 'string' ? claims.email : undefined;
    if (!claims || !email) throw new Error('the ID token has no email claim');
    const name =
        typeof claims.name === 'string'
            ? claims.name
            : typeof claims.preferred_username === 'string'
              ? claims.preferred_username
              : undefined;
    return {
        user: { sub: claims.sub, email, name },
        idToken: tokens.id_token,
        accessToken: tokens.access_token,
        accessExpiresAt: Date.now() + (tokens.expires_in ?? 300) * 1000,
        refreshToken: tokens.refresh_token
    };
}

/** Exchanges the refresh token for a new access token and updates the session. Throws when refused. */
export async function refresh(cfg: Config, session: Session) {
    if (!session.refreshToken) throw new Error('no refresh token');
    const config = await oidcConfig(cfg);
    const tokens = await client.refreshTokenGrant(config, session.refreshToken);
    session.accessToken = tokens.access_token;
    session.accessExpiresAt = Date.now() + (tokens.expires_in ?? 300) * 1000;
    if (tokens.refresh_token) session.refreshToken = tokens.refresh_token;
    if (tokens.id_token) session.idToken = tokens.id_token;
}

/** The address that ends the session at Authentik too, or undefined when it has no such endpoint. */
export async function endSessionUrl(cfg: Config, origin: string, idToken?: string) {
    const config = await oidcConfig(cfg);
    if (!config.serverMetadata().end_session_endpoint) return undefined;
    const params: Record<string, string> = { post_logout_redirect_uri: `${origin}/` };
    if (idToken) params.id_token_hint = idToken;
    return client.buildEndSessionUrl(config, params);
}
