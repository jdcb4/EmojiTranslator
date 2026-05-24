import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: {
          base: 'hsl(var(--surface-base) / <alpha-value>)',
          raised: 'hsl(var(--surface-raised) / <alpha-value>)',
          overlay: 'hsl(var(--surface-overlay) / <alpha-value>)',
          sunken: 'hsl(var(--surface-sunken) / <alpha-value>)',
        },
        text: {
          primary: 'hsl(var(--text-primary) / <alpha-value>)',
          secondary: 'hsl(var(--text-secondary) / <alpha-value>)',
          subtle: 'hsl(var(--text-subtle) / <alpha-value>)',
          'on-accent': 'hsl(var(--text-on-accent) / <alpha-value>)',
        },
        accent: {
          primary: 'hsl(var(--accent-primary) / <alpha-value>)',
          success: 'hsl(var(--accent-success) / <alpha-value>)',
          warning: 'hsl(var(--accent-warning) / <alpha-value>)',
          danger: 'hsl(var(--accent-danger) / <alpha-value>)',
          info: 'hsl(var(--accent-info) / <alpha-value>)',
        },
        border: {
          default: 'hsl(var(--border-default) / <alpha-value>)',
          subtle: 'hsl(var(--border-subtle) / <alpha-value>)',
          strong: 'hsl(var(--border-strong) / <alpha-value>)',
        },
      },
      borderRadius: {
        default: 'var(--radius-default)',
        compact: 'var(--radius-compact)',
      },
      fontSize: {
        display: [
          'var(--font-size-display)',
          { lineHeight: 'var(--line-height-display)' },
        ],
        h1: [
          'var(--font-size-h1)',
          { lineHeight: 'var(--line-height-heading)' },
        ],
        h2: [
          'var(--font-size-h2)',
          { lineHeight: 'var(--line-height-heading)' },
        ],
        h3: [
          'var(--font-size-h3)',
          { lineHeight: 'var(--line-height-heading)' },
        ],
        h4: [
          'var(--font-size-h4)',
          { lineHeight: 'var(--line-height-heading)' },
        ],
        body: [
          'var(--font-size-body)',
          { lineHeight: 'var(--line-height-body)' },
        ],
        'body-sm': [
          'var(--font-size-body-sm)',
          { lineHeight: 'var(--line-height-body)' },
        ],
        caption: [
          'var(--font-size-caption)',
          { lineHeight: 'var(--line-height-caption)' },
        ],
      },
    },
  },
  plugins: [],
} satisfies Config;
