---
type: explanation
audience: developer or reviewer who needs to know why the sign-in of the console is built this way
verified: 2026-11-06
---

# How the console signs people in

The console is rendered on the server, and the person who uses it signs in with their Authentik account. The aim is that no token ever reaches the browser. The values to configure are in the [configuration reference](../reference/configuration.md).

## The flow

1. A person asks for a page of the console without a session. The server sends them to `/login`.
2. `/login` makes a random `state`, a `nonce` and a PKCE verifier, keeps them in the memory of the server, and sets a cookie with a random identifier that points at them. It then sends the browser to Authentik, with the PKCE challenge.
3. The person signs in at Authentik, which sends the browser back to `/oidc/callback` with a code.
4. The callback takes the sign-in of this browser, once, checks the `state` and the `nonce`, exchanges the code and the PKCE verifier for tokens (with the client secret when the client has one), and checks the signature and the claims of the ID token.
5. It opens a session in the memory of the server with the tokens and the person's email, and sets the session cookie, which holds only an identifier. The identifier is new at every sign-in.
6. When a page needs the API, the server calls it with the access token of the session. The browser only receives the result.

## Why a session on the server

The decision [0009](https://github.com/phorge-fr/Hangar/blob/main/docs/decisions/0009-build-the-frontend-with-sveltekit.md) keeps the tokens out of the browser. A cookie that carried them, even encrypted, would put a credential for the API in every request and in every copy of the cookie. With an identifier, a stolen cookie is worth one session, and a restart or a sign-out ends it.

## The API judges the person, not the console

The access token is the person's. The API checks it and decides with OpenFGA what the person may do, so the console holds no right of its own and cannot do more than the person can. The `iss` and the `aud` of the token are those of the client the console signs in with. The console uses the shared client of the command line, a public one, so the API accepts its tokens as it does the command line's.

## What goes wrong, and what the person sees

| The API answers | The console |
| --- | --- |
| `401` | Ends the session and sends the person to sign in again, then back to the page. |
| `403` | Says that the person is not allowed. |
| `404` | Says that it does not exist, or that the person cannot see it. |
| `5xx`, or no answer | Says that the API is unavailable. The session is kept. |

The access token is renewed with the refresh token when less than 30 seconds are left. When Authentik refuses the refresh, the session ends and the person signs in again.

## Limits

- **The sessions are in memory.** A restart signs everybody out, and two replicas would not see each other's sessions. The console runs as one replica until the store is shared.
- **A session lasts 8 hours at most**, whatever the tokens allow.
- **Sign-out is `POST` only**, so that a link or an image on another site cannot sign a person out. SvelteKit also refuses a form posted from another origin in production.
- **Redirections out of the site are limited** to the origin of Authentik, and the page to come back to must be a path of the site.
