import { defineConfig, presetWind4 } from 'unocss';

// Design tokens come from the brand guide (phorge-fr/.github, docs/reference/brand-guide.md) and their extension for the console
// (status colors, three levels of text, a finer neutral scale). The values live in src/lib/styles/tokens.css as CSS variables, so
// that the light and dark themes switch there and the utility classes follow: `bg-surface`, `text-fg-2`, `border-line`.
export default defineConfig({
    presets: [presetWind4()],
    theme: {
        colors: {
            bg: 'var(--phorge-bg)',
            surface: 'var(--phorge-surface)',
            'surface-2': 'var(--phorge-surface-2)',
            highlight: 'var(--phorge-highlight)',
            fg: 'var(--phorge-text)',
            'fg-2': 'var(--phorge-text-2)',
            'fg-3': 'var(--phorge-text-3)',
            muted: 'var(--phorge-text-muted)',
            line: 'var(--phorge-line)',
            ctl: 'var(--phorge-control)',
            primary: 'var(--phorge-primary)',
            'primary-hover': 'var(--phorge-primary-hover)',
            'on-primary': 'var(--phorge-on-primary)',
            accent: 'var(--phorge-accent)',
            ok: {
                fg: 'var(--phorge-success-fg)',
                bg: 'var(--phorge-success-bg)',
                dot: 'var(--phorge-success-dot)'
            },
            warn: {
                fg: 'var(--phorge-warning-fg)',
                bg: 'var(--phorge-warning-bg)',
                dot: 'var(--phorge-warning-dot)'
            },
            bad: {
                fg: 'var(--phorge-danger-fg)',
                bg: 'var(--phorge-danger-bg)',
                dot: 'var(--phorge-danger-dot)'
            },
            prog: {
                fg: 'var(--phorge-progress-fg)',
                bg: 'var(--phorge-progress-bg)',
                dot: 'var(--phorge-progress-dot)'
            },
            idle: {
                fg: 'var(--phorge-idle-fg)',
                bg: 'var(--phorge-idle-bg)',
                dot: 'var(--phorge-idle-dot)'
            }
        },
        font: {
            sans: "'Source Sans 3', system-ui, sans-serif",
            // The system monospace stack: no monospace file is hosted (brand guide).
            mono: "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace"
        },
        shadow: {
            pop: 'var(--phorge-shadow-pop)'
        }
    },
    // The vocabulary every view uses, so that a button or a field is the same everywhere.
    shortcuts: {
        btn: 'inline-flex h-9 cursor-pointer select-none items-center justify-center gap-2 rounded-md border border-transparent px-4 text-sm font-semibold leading-none no-underline transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50',
        'btn-primary': 'btn bg-primary text-on-primary hover:bg-primary-hover',
        'btn-secondary': 'btn border-ctl bg-bg text-fg hover:bg-surface-2',
        'btn-ghost': 'btn text-fg-2 hover:bg-surface-2 hover:text-fg',
        'btn-danger': 'btn border-bad-dot bg-bad-bg text-bad-fg hover:border-bad-fg',
        field: 'block h-9 w-full rounded-md border border-ctl bg-bg px-3 text-sm text-fg placeholder:text-fg-3',
        'field-label': 'text-sm font-semibold text-fg',
        help: 'text-sm text-fg-3',
        panel: 'rounded-lg border border-line bg-bg'
    }
});
