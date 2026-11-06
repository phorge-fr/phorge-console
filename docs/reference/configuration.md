---
type: reference
audience: operator who deploys the console, developer who runs it against an identity provider
verified: 2026-11-06
---

# Console configuration

What the console reads from its environment, what it serves for signing in, and what it sets in the browser. How the pieces work together is in [How the console signs people in](../explanation/how-the-console-signs-people-in.md).

## Environment variables

All four are needed. When one is missing, every page of the console answers `503` and the showcase site is not affected.

| Variable | Meaning |
| --- | --- |
| `OIDC_ISSUER` | The issuer of the console application in Authentik, `https://<host>/application/o/<slug>/`. It must be `https`, except in the development server. |
| `OIDC_CLIENT_ID` | The client id of the confidential client of the console. |
| `OIDC_CLIENT_SECRET` | The client secret. It reaches the server only, through a Kubernetes Secret. |
| `API_URL` | The base URL of the Phorge API, such as `https://api.phorge.fr`. |

The adapter derives the address of the application from the request: the protocol is `https` unless `PROTOCOL_HEADER` names a header that says otherwise, and the host is the `Host` header or the one named by `HOST_HEADER`. Behind a proxy that keeps the original `Host`, nothing more is needed. The sign-in redirect address and the cross-site check of forms are built from this address.

## Routes

| Route | What it does |
| --- | --- |
| `GET /login` | Starts the sign-in and sends the browser to Authentik. `next` is the page to come back to: a path of this site, otherwise `/account`. |
| `GET /oidc/callback` | Where Authentik sends the browser back. Checks the answer, opens the session and goes to the page asked for. |
| `POST /logout` | Ends the session, then ends the one at Authentik and comes back to `/`. `GET` is refused. |
| `/account` | The signed-in person, as the API sees them (`GET /v1/whoami`). |

Every page except the showcase site needs a signed-in person; without one the browser is sent to `/login`.

## Address to register in Authentik

| Setting | Value |
| --- | --- |
| Redirect URI | `https://console.phorge.fr/oidc/callback`, strict matching |
| Post-logout redirect URI | `https://console.phorge.fr/` |
| Scopes | `openid`, `email`, `profile`, `offline_access` |
| Client type | Confidential, authorization code with PKCE (`S256`) and refresh token |

The token endpoint is called with the secret in the `Authorization` header (`client_secret_basic`). The API checks the `aud` of the access token, so the client id of the console must be one of the audiences the API accepts.

## What the browser holds

| Cookie | Content | Lifetime |
| --- | --- | --- |
| `phorge_session` | An opaque random identifier of the session, no token | 8 hours |
| `phorge_login` | An opaque random identifier of the sign-in in progress | 10 minutes, deleted at the callback |

Both are `HttpOnly`, `SameSite=Lax`, `Secure` outside the development server, and set for the whole site. No access token, refresh token or ID token is sent to the browser, in a cookie, a page or a URL.

## Headers

- `X-Robots-Tag: noindex` on every page rendered by the server. The prerendered showcase pages are served as files and do not carry it.
- `Cache-Control: no-store` when a session is open.
