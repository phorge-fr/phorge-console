---
type: reference
audience: operator who deploys the console, developer who runs it against an identity provider
verified: 2026-11-11
---

# Console configuration

What the console reads from its environment, what it serves for signing in, and what it sets in the browser. How the pieces work together is in [How the console signs people in](../explanation/how-the-console-signs-people-in.md).

## Environment variables

The issuer, the client id and the API address are needed. When one is missing, every page of the console answers `503`, except the probe `/healthz`. The client secret is optional, see [Client type](#client-type).

| Variable | Meaning |
| --- | --- |
| `OIDC_ISSUER` | The issuer of the application of the client in Authentik, `https://<host>/application/o/<slug>/`. It must be `https`, except in the development server. |
| `OIDC_CLIENT_ID` | The client id of the OIDC client the console signs in with. |
| `OIDC_CLIENT_SECRET` | Optional. The client secret of a confidential client. Leave it unset for a public client. It reaches the server only, through a Kubernetes Secret. |
| `API_URL` | The base URL of the Phorge API, such as `https://api.phorge.fr`. |
| `ORIGIN` | Optional, read by the adapter. When set, it is also the only `Origin` the websocket of a terminal accepts; without it the `Origin` must have the host of the request. |

The adapter derives the address of the application from the request: the protocol is `https` unless `PROTOCOL_HEADER` names a header that says otherwise, and the host is the `Host` header or the one named by `HOST_HEADER`. Behind a proxy that keeps the original `Host`, nothing more is needed. The sign-in redirect address and the cross-site check of forms are built from this address.

## Routes

| Route | What it does |
| --- | --- |
| `GET /healthz` | The probe of the container: `200 ok` when the server is up. It needs no setting and calls neither Authentik nor the API. |
| `GET /login` | Starts the sign-in and sends the browser to Authentik. `next` is the page to come back to: a path of this site, otherwise `/tenants`. |
| `GET /oidc/callback` | Where Authentik sends the browser back. Checks the answer, opens the session and goes to the page asked for. |
| `POST /logout` | Ends the session, then ends the one at Authentik and comes back to `/`. `GET` is refused. |
| `/` | The home of the console: the tenants the person can see (`GET /v1/tenants`). `/tenants` redirects to it. |
| `/t/<tenant>` | One tenant (`GET /v1/tenants/<tenant>`): its state, its plan and its owner, and what it holds of what the plan allows (`GET /v1/tenants/<tenant>/quota`: virtual machines, vCPU, memory, disk and networks; a failure of the quota leaves the meters out, not the page). The administrators of the tenant, its owner included, change the display name (`PATCH`; the plan cannot be changed, the API answers `403`) and delete the tenant (`DELETE`, after typing its name). `/t/<tenant>/members` is a view of the tenant that is not built yet. A name that is not a valid tenant name is a `404` without calling the API. |
| `/t/<tenant>/images` | The images of the tenant (`GET /v1/tenants/<tenant>/images`) with their state; the list follows an image that is being pulled or deleted. Operators and administrators delete one (`DELETE`, after typing its name, asked with `?delete=<name>`); the API answers `409` while a virtual machine still starts from it, and its message names them. The API does not say which role the person holds on a tenant, so the actions are offered to everybody and a `403` is explained next to the form. |
| `/t/<tenant>/images/new` | The form that pulls an image (`POST`, from the `images` server only): name, source and aliases. Sending it goes back to the list, which follows the image until it is ready. |
| `/t/<tenant>/networks` | The networks of the tenant (`GET /v1/tenants/<tenant>/networks`) with their ranges (`ipv4` and `ipv6`, from the person or chosen by Incus; absent while unknown, which is not an error) and their state; the list follows a network that is being deployed or deleted. A tenant comes without any network. Operators and administrators delete one (`DELETE`, after typing its name, asked with `?delete=<name>`); the API answers `409` while a virtual machine is attached, and its message names them. Same rule as for images: the actions are offered to everybody and a `403` is explained. |
| `/t/<tenant>/networks/new` | The form that creates a network (`POST`): a name of 1 to 15 characters, a description and an optional IPv4 range (`ipv4`, a CIDR such as `10.77.1.0/24`) and an optional local IPv6 range (`ipv6`, a `/64` in `fd00::/8` written as the network address, such as `fd42:1:2:3::/64`); the console only checks their shape, and the API's answers `422`, `409 range_reserved` and `409 range_in_use` are shown as they are. The name `new` is reserved by the console. Sending it goes back to the list, which follows the network until it is ready. |
| `/t/<tenant>/networks/<name>` | One network (`GET`) and its edit form (`PATCH`, answer `202`): the description (empty removes it), the IPv4 range and the IPv6 range. Only what differs from the network is sent, as the API leaves what is absent as it is. A range the network has cannot be removed: an emptied range is sent as it is and the API's `422` is shown. The refusals `409 range_reserved`, `409 range_in_use` and `409 running` are shown as the API words them: `running` refuses a new IPv4 range while an instance runs on the network and names the instances, and the console never stops an instance to make the change possible, the person does it from the instance. A new IPv6 range is accepted while instances run. As for images, the actions are offered to everybody and a `403` is explained. A name that is not a valid network name is a `404` without calling the API. |
| `/t/<tenant>/profiles` | The profiles of the tenant (`GET /v1/tenants/<tenant>/profiles`): `s`, `m` and `l`, which every tenant has and which cannot be changed, then the ones its people made, with their size and state; the list follows a profile that is being made or deleted. Operators and administrators delete one they made (`DELETE`, after typing its name, asked with `?delete=<name>`); the API answers `409` while a virtual machine has it, and its message names them. Same rule as for images: the actions are offered to everybody and a `403` is explained. |
| `/t/<tenant>/profiles/new` | The form that makes a profile (`POST`): a name of 1 to 32 characters (`s`, `m`, `l` and `default` are taken), a description, and the vCPU, the memory and the disk, all three. A profile cannot be changed afterwards. |
| `/t/<tenant>/instances` | The virtual machines of the tenant (`GET /v1/tenants/<tenant>/instances`) with their state. The list follows what is being made, started, stopped or deleted. A limit of the plan is refused when the instance is created (`409`, `quota_exceeded`, with a message that says which limit). |
| `/t/<tenant>/instances/new` | The form that creates a virtual machine from a `Ready` image of the tenant, attached to a `Ready` network of the tenant (`POST`; a tenant without a network is sent to create one first): the size, which is a profile of the tenant or a custom size (the vCPU, the memory and the disk within the limits of the API, empty means its defaults), never both, with what is left in the plan said under them (from the quota of the tenant), SSH keys checked as the API checks them, and the options that cannot change later (start, secure boot, nesting). The name `new` is reserved by the console. |
| `/t/<tenant>/instances/<name>` | One virtual machine (`GET`), with start and stop (`PATCH running`, the same machine; the API answers `409` with the time to wait right after a start), the size (`PATCH cpu, memoryMiB, diskGiB`; a bigger size is applied live, and lowering the memory of a running machine, by a value or by a smaller profile, is refused by the API with `409` and the code `running`, whose sentence the page shows as it is: the person stops the machine, resizes it and starts it with the buttons of the page, and a resize never changes the power state), the SSH keys (`PATCH sshPublicKeys`, one per line, the whole list is replaced) the profile (`PATCH profile`, which replaces its own size; giving the three values together takes it out of the profile) and the deletion (`DELETE`, after typing its name, which destroys the disk). An instance that failed to start the first time is stuck: the page says to delete it and create it again. As for images, the actions are offered to everybody until the API says which role the person holds. A name that is not a valid instance name is a `404` without calling the API. |
| `/t/<tenant>/instances/<name>/terminal` | The terminal of a running instance, a shell as root in the page (xterm.js). Without a running instance the page says so and does not connect. It talks to `/t/<tenant>/instances/<name>/terminal/socket`, a websocket of this server (not a SvelteKit route: `server.js` takes it), authenticated by the session cookie and the `Origin`, which the console relays to `GET /v1/tenants/<tenant>/instances/<name>/console` with the token of the person. The refusals and the endings of the API are shown with its own sentences. See [how the terminal works](../explanation/how-the-terminal-works.md). |
| `/new` | Create a tenant (`POST /v1/tenants`): a name and a display name. The person is the owner and the plan is `small`, so the form has neither choice; it is offered when `GET /v1/whoami` says `canCreateTenants`, and the API refuses past the number of tenants a person may own (`409`, `quota_exceeded`). The person is then sent to the page of the new tenant, which follows it until it is `Ready`. |
| `GET /t/<tenant>/status` | The state of a tenant as JSON (`phase`, `problems`, or `gone`), which the page of a tenant polls while it is being made or deleted. Nothing else leaves through it. |
| `GET /switch` | The tenant switcher: goes to the same section of the tenant given in `tenant`. Only a valid tenant name and a known section are used to build the address. |
| `/api-keys` | The keys of the signed-in person (`GET /v1/apikeys`): what each may do on which tenant, when it expires and whether it has. `?rename=<id>` shows the form that renames a key (`PATCH`, the only change the API allows) and `?revoke=<id>` the confirmation that revokes it (`DELETE`, after typing its name); the key stops working at once. |
| `/api-keys/new` | The form that creates a key (`POST /v1/apikeys`), laid out like the fine-grained tokens of GitHub: a name, an expiration (7, 30, 60 or 90 days, or a chosen day; the end of that day in UTC, and the API checks the maximum lifetime) and **access**, made of rules. A rule gives permissions on tenants. The permissions are the resources of the list in `src/lib/apikeys.ts` (a new right is one line there), each with a checkbox for all its verbs and a "Choose" that shows each one by its name (`instances:read`, `instances:write`, ...); a verb can be given on every resource at once, and a filter narrows the list, so a resource with eight verbs or ten resources with the same verb are a click. The tenants are picked by search and shown as removable chips. A closed rule is one line and one rule is open at a time, so that many rules stay short. Rules add up, and a key covers 50 tenants at most (the limit of the API), so no more than 50 rules. The answer is the page of the key, shown once with its user name: it is passed to the page as it is, sent with `Cache-Control: no-store`, and kept nowhere else (not in the session, not in a log), because the API cannot give it again. The form needs JavaScript to choose the tenants. Any signed-in person creates keys, within what they hold themselves; the API refuses the rest and the form says so. |
| `/account` | The signed-in person, as the API sees them (`GET /v1/whoami`). |

Every page needs a signed-in person; without one the browser is sent to `/login`, and back to the same page after.

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
| Command | `server.js`, which starts the server of the adapter and adds the websocket of the terminal |
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

- `X-Robots-Tag: noindex` on every page rendered by the server.
- `Cache-Control: no-store` when a session is open.
