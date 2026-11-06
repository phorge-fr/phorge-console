import { defineConfig, presetWind4 } from 'unocss';

// Design tokens come from the brand guide (phorge-fr/.github, docs/reference/brand-guide.md). The values
// live in src/lib/styles/tokens.css as CSS variables, so that the light and dark themes switch there and
// the utility classes follow: `bg-surface`, `text-muted`, `border-accent`.
export default defineConfig({
    presets: [presetWind4()],
    theme: {
        colors: {
            bg: 'var(--phorge-bg)',
            surface: 'var(--phorge-surface)',
            highlight: 'var(--phorge-highlight)',
            fg: 'var(--phorge-text)',
            muted: 'var(--phorge-text-muted)',
            primary: 'var(--phorge-primary)',
            'on-primary': 'var(--phorge-on-primary)',
            accent: 'var(--phorge-accent)'
        },
        font: {
            sans: "'Source Sans 3', system-ui, sans-serif",
            // The system monospace stack: no monospace file is hosted (brand guide).
            mono: "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace"
        }
    }
});
