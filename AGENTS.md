# AGENTS.md: phorge-console

Instructions for anyone working in this repository, human or AI assistant. The organization-wide rules (issues, pull requests, time tracking, security reporting) are in [phorge-fr/.github](https://github.com/phorge-fr/.github/blob/main/AGENTS.md) and [GOVERNANCE.md](https://github.com/phorge-fr/.github/blob/main/GOVERNANCE.md); this file only adds what is specific to phorge-console.

## What this repository is

The showcase site (`phorge.fr`) and the web console (`console.phorge.fr`) of Phorge, in one SvelteKit application. The framework, the build tool and the hosting are decided in Hangar: [0008](https://github.com/phorge-fr/Hangar/blob/main/docs/decisions/0008-keep-svc-and-host-the-frontend-on-it.md) and [0009](https://github.com/phorge-fr/Hangar/blob/main/docs/decisions/0009-build-the-frontend-with-sveltekit.md). The platform it runs on (manifests, network policy, ingress, the Authentik client) lives in `phorge-fr/Hangar` and `phorge-fr/Network`; a platform change needed here is a pull request there.

## Workflow

- One issue per change, a short branch cut from the current `origin/main` (`feat/`, `fix/`, `docs/`, `chore/`), one pull request with `Closes #N`. Never commit or push to `main`. Text is in English.
- `main` is protected: the checks `check`, `lint`, `build`, `audit`, `yamllint`, `docs / docs-lint` and `governance / pr-governance` must pass.
- Renovate maintains dependencies (a self-hosted workflow using the `RENOVATE_TOKEN` secret).

## Commands

```bash
pnpm install
pnpm check lint build      # what CI runs
```

Use Node 22 (`.nvmrc`) and the pnpm version in `package.json`. Commit `pnpm-lock.yaml`.

## Rules specific to this repository

- **SvelteKit 3 has no `svelte.config.js`.** Its configuration, including the adapter, is passed to `sveltekit(...)` in `vite.config.ts`. The framework refuses to build if a `svelte.config.js` exists.
- **The console is rendered on the server and tokens stay out of the browser.** The session lives on the Node server and signs in with an OIDC client defined by an Authentik blueprint in Hangar, public (PKCE, no secret) unless a secret is configured ([decision 0009](https://github.com/phorge-fr/Hangar/blob/main/docs/decisions/0009-build-the-frontend-with-sveltekit.md)). Never put an access token in client-side code, local storage or a URL.
- **`/` is the home of the console.** The showcase page (`phorge.fr`) is set aside in `src/site/`, outside the routes, until it is decided where it lives; the console is marked `noindex`.
- **Respect the GDPR notes** in Hangar ([docs/reference/gdpr-personal-data.md](https://github.com/phorge-fr/Hangar/blob/main/docs/reference/gdpr-personal-data.md)) for cookies, third-party content (fonts, scripts, analytics) and logs of personal data.
- **Design tokens come from the brand guide** ([brand guide](https://github.com/phorge-fr/.github/blob/main/docs/reference/brand-guide.md)). Do not invent a palette or pick a typeface. `src/lib/styles/tokens.css` and `static/brand/` are copies of `brand/` in `phorge-fr/.github`: change them there first, then copy. See [the design system reference](docs/reference/design-system.md).
- A new dependency is checked for license compatibility (Apache-2.0) and listed in `THIRD_PARTY_NOTICES.md`.
- Never commit a secret, a token or an address of a private system.
- When something is missing or ambiguous (public host names, who may use which console view), ask; do not invent.
