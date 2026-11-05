---
type: how-to
audience: developer who works on the showcase site or the console
verified: 2026-11-05
---

# Run the console locally

This starts the application on your machine and runs the same checks as the CI.

## Before you start

- Node 22.17 or later. The `.nvmrc` file pins the major version: with nvm, run `nvm use`.
- pnpm. The version is in the `packageManager` field of `package.json`; Corepack or the standalone installer both work.

## Steps

1. Install the dependencies from the lockfile:

    ```bash
    pnpm install --frozen-lockfile
    ```

2. Start the development server and open the address it prints:

    ```bash
    pnpm dev
    ```

3. Run the checks before you open a pull request:

    ```bash
    pnpm check
    pnpm lint
    pnpm build
    ```

## Verify

`pnpm build` writes the production server to `build/`. Start it and request the home page:

```bash
PORT=3000 node build
curl -s http://127.0.0.1:3000/
```

The response is HTML with the title `Phorge`.

## Undo

Stop the server with Ctrl+C. `build/` and `node_modules/` are ignored by git; remove them to get a clean tree.

## Troubleshooting

- **`svelte.config.js is no longer used`**: SvelteKit 3 reads its configuration from `vite.config.ts`. Remove the `svelte.config.js` file.
- **`transformIndexHtml hook is not supported`**: SvelteKit prints this about the UnoCSS plugins. The CSS is still generated, because the styles are imported through `virtual:uno.css`.
