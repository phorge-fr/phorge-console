---
type: reference
audience: developer who builds a page or a component of the console
verified: 2026-11-11
---

# Design system

How the brand guide reaches the application and how the console extends it: the colors, the status colors, the typeface, the logos, the two themes, the icons, the shared classes and the frame. The brand values and their contrast ratios are in the [brand guide](https://github.com/phorge-fr/.github/blob/main/docs/reference/brand-guide.md); this page says where they live here and what the console adds.

## Sources

| What | File | Source of truth |
| --- | --- | --- |
| Brand tokens | `src/lib/styles/tokens.css` | `brand/tokens.css` in `phorge-fr/.github` |
| Console tokens (status colors, text levels, neutral scale) | `src/lib/styles/tokens.css` | This repository, until they are written back into the brand guide ([phorge-fr/.github#59](https://github.com/phorge-fr/.github/issues/59)) |
| Logos | `static/brand/` | `brand/` in `phorge-fr/.github` |
| Typeface | `@fontsource/source-sans-3`, imported in `src/lib/styles/app.css` | [Source Sans 3](https://github.com/adobe-fonts/source-sans), OFL 1.1 |
| Icons | `@lucide/svelte`, one import per icon | [Lucide](https://lucide.dev), ISC |

The brand tokens and the logos are copies: change them in `phorge-fr/.github` first. The console tokens are the extension the product asked for (the brand guide had no status colors), and they carry a contrast check: text 4.5:1 on its background and on its tint, controls and dots 3:1.

## Themes

The light theme is the default. The dark theme applies when the system asks for it. `data-theme="light"` or `data-theme="dark"` on the root element forces one of them; nothing sets it yet, and no choice is stored.

The terminal of an instance is a dark pane in both themes, because the colors of a shell are made for a dark background. It uses the dark values of the tokens (`--phorge-surface` for the background, `--phorge-text` for the text, `--phorge-primary` for the cursor) and the default palette of xterm.js for the colors a program asks for.

The wordmark has a light and a dark file. Both are in the page and `app.css` shows the one that matches the theme, so the logo follows the forced theme as well as the system one.

## Colors

`uno.config.ts` maps the tokens to UnoCSS colors, so a class follows the theme without a `dark:` variant.

| Class suffix | Token | Use |
| --- | --- | --- |
| `bg` | `--phorge-bg` | Page background |
| `surface` | `--phorge-surface` | Side column, table headers, panels at rest |
| `surface-2` | `--phorge-surface-2` | Hover and selected rows, the current item of the navigation |
| `highlight` | `--phorge-highlight` | Highlighted rows |
| `fg` | `--phorge-text` | Body text and titles |
| `fg-2` | `--phorge-text-2` | Secondary text |
| `fg-3` | `--phorge-text-3` | Help text, placeholders, units |
| `line` | `--phorge-line` | Hairlines between rows and around panels |
| `ctl` | `--phorge-control` | The border of a field or a button, 3:1 at least |
| `primary`, `primary-hover` | `--phorge-primary`, `--phorge-primary-hover` | Links, the main button |
| `on-primary` | `--phorge-on-primary` | Text on a primary fill |
| `accent` | `--phorge-accent` | Focus rings |
| `ok`, `warn`, `bad`, `prog`, `idle` + `-fg`, `-bg`, `-dot` | `--phorge-success-*`, `warning-*`, `danger-*`, `progress-*`, `idle-*` | Success, warning, failure, in progress, and the end of life: the text, the tint behind it and a dot or a border |

The accent colors are for actions, the current selection and states. A status is never carried by its color alone: it is written, and drawn with an icon (`PhaseBadge`, `Alert`). The font families are `font-sans` (Source Sans 3) and `font-mono` (the system monospace stack, no file is hosted); the body is 15 px, the dense parts 14 px (`text-sm`), and numbers that line up use `tnum`.

## Shared classes

`uno.config.ts` defines the vocabulary every view uses, so that a button or a field is the same everywhere: `btn-primary` (the one main action of a page), `btn-secondary`, `btn-ghost`, `btn-danger`, `field`, `field-label`, `help` and `panel`. A new view uses them instead of repeating utilities.

## Layout

`src/routes/+layout.svelte` loads the styles only. The frame of the console is in `src/routes/(console)/+layout.svelte`: a side column on a desktop with the tenant menu, the sections and the account (`AppNav`), and on a phone a bar with a menu button that holds the same navigation. The menu and the tenant switcher are `<details>`, so they open without JavaScript. A page draws its own `<main>`, starts with `PageHeader` (title, a second line, the main action) and is at most 64 rem wide. A page of settings is a stack of `SettingsSection` blocks (what it is on the left, what to do on the right, separated by hairlines, never boxed in cards); lists are tables that stack on a phone; quotas are `Meter`s; messages are `Alert`s. Import from `src/lib` with `#lib/...`: SvelteKit 3 no longer provides `$lib`, and the alias is the `imports` field of `package.json`.
