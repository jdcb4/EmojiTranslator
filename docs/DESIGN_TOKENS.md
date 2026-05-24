# Design Tokens

Visual style is defined as named tokens. Components should use semantic token classes instead of raw colors, raw rem values, or raw Tailwind palette classes.

## Token Sources

- `src/styles/tokens.css` is the source of truth for CSS custom properties.
- `tailwind.config.ts` maps those properties to semantic Tailwind classes.
- `src/components/ui` contains reusable primitives that consume the tokens.

## Available Tokens

Surfaces:

- `bg-surface-base`
- `bg-surface-raised`
- `bg-surface-overlay`
- `bg-surface-sunken`

Text:

- `text-text-primary`
- `text-text-secondary`
- `text-text-subtle`
- `text-text-on-accent`

Accents:

- `bg-accent-primary` / `text-accent-primary`
- `bg-accent-success` / `text-accent-success`
- `bg-accent-warning` / `text-accent-warning`
- `bg-accent-danger` / `text-accent-danger`
- `bg-accent-info` / `text-accent-info`

Borders:

- `border-border-default`
- `border-border-subtle`
- `border-border-strong`

Typography:

- `text-display`
- `text-h1`
- `text-h2`
- `text-h3`
- `text-h4`
- `text-body`
- `text-body-sm`
- `text-caption`

## Component Guidance

- Use `<Heading>`, `<Body>`, `<Subtle>`, and `<Caption>` from `src/components/ui/typography.tsx` for text.
- Use `<Surface>` from `src/components/ui/surface.tsx` for token-backed panels.
- Add new tokens before introducing a new visual decision.
- Keep layout-only utilities inline when they do not encode visual style decisions.

## Adding Tokens

1. Edit `src/styles/tokens.css`.
2. Expose new variables in `tailwind.config.ts` when a class name is needed.
3. Add or update UI primitives if the token represents a reusable pattern.
4. Document non-obvious tokens here.
