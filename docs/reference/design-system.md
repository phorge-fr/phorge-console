---
type: reference
audience: developer who builds a page or a component of the showcase site or the console
verified: 2026-11-06
---

# Design system

How the brand guide reaches the application: the colors, the typeface, the logos, the two themes and the shared layout. The values and their contrast ratios are in the [brand guide](https://github.com/phorge-fr/.github/blob/main/docs/reference/brand-guide.md); this page only says where they live here.

## Sources

| What | File | Source of truth |
| --- | --- | --- |
| Color tokens | `src/lib/styles/tokens.css` | `brand/tokens.css` in `phorge-fr/.github` |
| Logos | `static/brand/` | `brand/` in `phorge-fr/.github` |
| Typeface | `@fontsource/source-sans-3`, imported in `src/lib/styles/app.css` | [Source Sans 3](https://github.com/adobe-fonts/source-sans), OFL 1.1 |

The tokens and the logos are copies. To change one, change it in `phorge-fr/.github` first, then copy the file here unchanged.

## Themes

The light theme is the default. The dark theme applies when the system asks for it. `data-theme="light"` or `data-theme="dark"` on the root element forces one of them; nothing sets it yet, and no choice is stored.

The wordmark has a light and a dark file. Both are in the page and `app.css` shows the one that matches the theme, so the logo follows the forced theme as well as the system one.

## Classes

`uno.config.ts` maps the tokens to UnoCSS colors, so a class follows the theme without a `dark:` variant.

| Class suffix | Token | Use |
| --- | --- | --- |
| `bg` | `--phorge-bg` | Page background |
| `surface` | `--phorge-surface` | Header, footer, panels |
| `highlight` | `--phorge-highlight` | Selected rows |
| `fg` | `--phorge-text` | Body text |
| `muted` | `--phorge-text-muted` | Secondary text |
| `primary` | `--phorge-primary` | Links, button fill |
| `on-primary` | `--phorge-on-primary` | Text on a primary fill |
| `accent` | `--phorge-accent` | Borders, icons, focus rings |

For example `bg-surface`, `text-muted`, `border-accent`. The font families are `font-sans` (Source Sans 3) and `font-mono` (the system monospace stack, no file is hosted).

## Layout

`src/routes/+layout.svelte` wraps every page in `SiteHeader` (the wordmark and an optional navigation) and `SiteFooter`, both in `src/lib/components/`. Import from `src/lib` with `#lib/...`: SvelteKit 3 no longer provides `$lib`, and the alias is the `imports` field of `package.json`.
