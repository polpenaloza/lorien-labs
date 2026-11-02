import { defineConfig, presetWind3 } from 'unocss';

// Every value points at src/styles/tokens.css, the CSS form of design/tokens.json.
export default defineConfig({
  // `dark: 'media'` makes `light:` follow the system theme, as tokens.css does.
  presets: [presetWind3({ dark: 'media' })],
  theme: {
    colors: {
      brand: { navy: 'var(--brand-navy)', paper: 'var(--brand-paper)', leaf: 'var(--brand-leaf)' },
      surface: { '000': 'var(--surface-000)', '100': 'var(--surface-100)', '200': 'var(--surface-200)' },
      ink: { DEFAULT: 'var(--ink)', muted: 'var(--ink-muted)' },
      accent: 'var(--accent)',
      on: { accent: 'var(--on-accent)' },
      hairline: 'var(--hairline)',
    },
    fontFamily: { display: 'var(--font-display)', label: 'var(--font-label)' },
    fontSize: {
      display: ['64px', '64px'],
      'heading-1': ['48px', '52px'],
      'heading-2': ['32px', '36px'],
      small: ['14px', '20px'],
      label: ['12px', '16px'],
    },
    spacing: {
      1: 'var(--space-1)',
      2: 'var(--space-2)',
      4: 'var(--space-4)',
      6: 'var(--space-6)',
      8: 'var(--space-8)',
      12: 'var(--space-12)',
    },
    borderRadius: { sm: 'var(--radius-sm)', md: 'var(--radius-md)' },
    maxWidth: { page: 'var(--content-width)' },
    breakpoints: { sm: '30rem' },
  },
  shortcuts: {
    wrap: 'mx-auto max-w-page px-4 sm:px-8',
    mark: 'bg-brand-navy [image-rendering:pixelated]',
    button: 'inline-block px-4 py-2 rounded-md bg-accent text-on-accent font-semibold no-underline',
    cards: 'grid grid-cols-[repeat(auto-fit,minmax(min(20rem,100%),1fr))] gap-6',
    stack: 'flex flex-col gap-6',
    card: 'flex flex-col gap-2 p-4 border border-solid border-hairline bg-surface-200 children:m-0',
    panel: 'p-4 sm:p-8 border border-solid border-hairline bg-surface-200',
    meta: 'text-small text-ink-muted',
    label: 'font-label text-label tracking-[0.04em] uppercase',
    tag: 'label px-1 rounded-sm bg-surface-000 text-ink-muted',
  },
});
