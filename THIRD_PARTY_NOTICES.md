# Third-party notices

phorge-console is licensed under the [Apache License 2.0](LICENSE). It is built with the open-source packages below, all licensed in a way that is compatible with it. The list covers direct dependencies as of the versions in `pnpm-lock.yaml`; transitive dependencies are resolved by pnpm and audited in CI (`pnpm audit`).

| Package | License |
| --- | --- |
| [@fontsource/source-sans-3](https://github.com/fontsource/font-files) | OFL-1.1 |
| [@sveltejs/adapter-node](https://github.com/sveltejs/kit) | MIT |
| [@sveltejs/kit](https://github.com/sveltejs/kit) | MIT |
| [@sveltejs/vite-plugin-svelte](https://github.com/sveltejs/vite-plugin-svelte) | MIT |
| [@unocss/extractor-svelte](https://github.com/unocss/unocss) | MIT |
| [prettier](https://github.com/prettier/prettier) | MIT |
| [prettier-plugin-svelte](https://github.com/sveltejs/prettier-plugin-svelte) | MIT |
| [svelte](https://github.com/sveltejs/svelte) | MIT |
| [svelte-check](https://github.com/sveltejs/language-tools) | MIT |
| [typescript](https://github.com/microsoft/TypeScript) | Apache-2.0 |
| [unocss](https://github.com/unocss/unocss) | MIT |
| [vite](https://github.com/vitejs/vite) | MIT |

## Typeface

The typeface of the brand guide, [Source Sans 3](https://github.com/adobe-fonts/source-sans) (copyright Adobe), is under the SIL Open Font License 1.1. The application serves its Latin files from its own origin, from the `@fontsource/source-sans-3` package, in weights 400, 600 and 700.

## Brand assets

The tokens in `src/lib/styles/tokens.css` and the logo files in `static/brand/` are copies of `brand/` in [phorge-fr/.github](https://github.com/phorge-fr/.github), under the Apache License 2.0. That license grants no right to use the Phorge name or logo as a trademark.
