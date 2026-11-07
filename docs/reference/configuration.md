---
type: reference
audience: operator who deploys the console, developer who runs it against an identity provider
verified: 2026-11-06
---

# Console configuration

What the console reads from its environment, what it serves for signing in, and what it sets in the browser. How the pieces work together is in [How the console signs people in](../explanation/how-the-console-signs-people-in.md).

## Environment variables

The issuer, the client id and the API address are needed. When one is missing, every page of the console answers `503` and the showcase site is not affected. The client secret is optional, see [Client type](#client-type).

| Variable | Meaning |
| --- | --- |
| `OIDC_ISSUER` | The issuer of the application of the client in Authentik, `https://<host>/application/o/<slug>/`. It must be `https`, except in the development server. |
| `OIDC_CLIENT_ID` | The client id of the OIDC client the console signs in with. |
| `OIDC_CLIENT_SECRET` | Optional. The client secret of a confidential client. Leave it unset for a public client. It reaches the server only, through a Kubernetes Secret. |
| `API_URL` | The base URL of the Phorge API, such as `https://api.phorge.fr`. |

The adapter derives the address of the application from the request: the protocol is `https` unless `PROTOCOL_HEADER` names a header that says otherwise, and the host is the `Host` header or the one named by `HOST_HEADER`. Behind a proxy that keeps the original `Host`, nothing more is needed. The sign-in redirect address and the cross-site check of forms are built from this address.

## Routes

| Route | What it does |
| --- | --- |
| `GET /healthz` | The probe of the container: `200 ok` when the server is up. It needs no setting and calls neither Authentik nor the API. |
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
| Client type | Public or confidential, authorization code with PKCE (`S256`) and refresh token |

The API checks the issuer and the `aud` of the access token, so the issuer and the client id must be the ones the API accepts.

### Client type

The console works with both, and the secret decides:

- **Without `OIDC_CLIENT_SECRET`**, it is a public client. The token endpoint is called with the client id only (`none`) and PKCE binds the code to the browser that started the sign-in. This is what the shared client of the command line is, and the one the console is deployed with.
- **With `OIDC_CLIENT_SECRET`**, it is a confidential client. The secret goes in the `Authorization` header (`client_secret_basic`), on top of PKCE.

A secret set for a public client, or missing for a confidential one, makes the token endpoint refuse the code: the sign-in fails with `401` and the reason is in the log.

## Container image

The `Dockerfile` builds the Node server with the Node version of `.nvmrc` and runs it on a distroless Node image, for `linux/amd64` and `linux/arm64`. The `docker` workflow checks it on every pull request and publishes it to `ghcr.io/phorge-fr/phorge-console`, tagged `sha-<commit>` and `latest`, on a push to `main`.

| Setting | Value |
| --- | --- |
| User | `65532:65532`, no shell, no package manager |
| Port | `3000`, from `PORT` (and `HOST`, default `0.0.0.0`) |
| Probe | `GET /healthz` |
| Writes | None: it runs with a read-only root filesystem and no capability |
| Secrets | None in the image; the settings above are given at run time |
| Stop | `SIGTERM` ends the server and the exit code is `0` |

The sessions live in the memory of the process: run one replica, and a restart signs everyone out.

## What the browser holds

| Cookie | Content | Lifetime |
| --- | --- | --- |
| `phorge_session` | An opaque random identifier of the session, no token | 8 hours |
| `phorge_login` | An opaque random identifier of the sign-in in progress | 10 minutes, deleted at the callback |

Both are `HttpOnly`, `SameSite=Lax`, `Secure` outside the development server, and set for the whole site. No access token, refresh token or ID token is sent to the browser, in a cookie, a page or a URL.

## Headers

- `X-Robots-Tag: noindex` on every page rendered by the server. The prerendered showcase pages are served as files and do not carry it.
- `Cache-Control: no-store` when a session is open.
