# Lorien Labs design system

Source of truth for the site's look. `tokens.json` holds every colour, type style, spacing step and radius; `src/styles/tokens.css` is its CSS form for the site. Change a value in both places.

Lorien Labs is a tree with its roots showing: steady, grown rather than assembled, and drawn on a grid. The system pairs the logo's navy, paper and leaf blue with pixel typefaces. It is calm in colour and crisp in type.

## Logo

- The mark is pixel art: a 49×49 grid in `scripts/logo.mjs`. `pnpm logo` writes `assets/lorien-labs-mark.png` and the sized copies for the site (`public/logo.png`, `public/logo-light.png`, `public/favicon.svg`, `public/apple-touch-icon.png`). Show it only at multiples of 49px, with `image-rendering: pixelated`, so every pixel stays square.
- It is an off-white tree with leaf-blue leaves and a leaf-blue root arc. Every mark is transparent: never put it on a tile or a background colour. The only exception is the touch icon, which keeps its navy square because iOS fills transparency with black.
- On dark grounds (the hero's night sky, `surface-100` in the dark theme) use the off-white tree (`logo.png`). On light ones use its twin with the off-white drawn in `brand-navy` (`logo-light.png`), switched by `prefers-color-scheme`. `favicon.svg` carries both and switches itself.
- Never recolour beyond that light twin, outline, crop the roots or add a shadow to the mark. There is no wordmark file yet: when you need the name, set "Lorien Labs" in `display` (or `heading-1`) in `ink` beside the mark.

## Hero scene

- The home hero is a night forest drawn by `scripts/scene.mjs`: silver trees, snowy mountains, a river, an elven refuge in the valley, the moon. `pnpm scene` writes one transparent 480×270 layer per depth to `public/scene/`, a flat preview to `assets/hero-scene.png` and the link preview image `public/og.png`.
- It uses only the palette's dark values, so the scene is night in both themes. Pixel art has no blends: gradients and fades are ordered dithering, glows are a ring of pixels.
- `src/components/HeroScene.astro` stacks the layers. Each has a `depth`: how far it sinks and pans while the page scrolls, and how far it leans from the pointer. Haze drifts, stars, river and waterfalls twinkle, leaves fall and fireflies blink. All of it stops for reduced motion.
- Haze is translucent the pixel art way, after lorien-studio's renderer: wisps blended with `mix-blend-mode: lighten` lift every darker colour behind them a step and let brighter ones (snow, trunks, lanterns) cut through, so the result stays on the palette.
- It evokes an elven forest; it never copies a film, a game or a named place.

## Colour

- Dark is the primary theme. Use `surface-100` for the page, `surface-200` for cards and `surface-000` for wells and code.
- Set text in `ink` and secondary text in `ink-muted`. Use `accent` for links and anything interactive, and `on-accent` on an `accent` fill.
- `brand-navy`, `brand-paper` and `brand-leaf` are identity colours that stay the same in both themes. Use them for hero bands, illustration and the mark's surroundings, not for UI states.
- Keep `brand-leaf` for fills. Text on it must be 24px+ or bold 19px+ in `brand-paper`.
- Use `hairline` for decorative dividers, `border-strong` for control borders, and a 2px solid `focus-ring` offset by 2px for keyboard focus.
- No gradients or glows. The logo is flat: three colours on one ground.

## Type

- Pixel faces are for short, large text; reading text gets a plain one. **VT323** sets `display`, `heading-1` and `heading-2`: titles, banners and the name beside the mark. It is drawn on a 16px grid and has one weight, so keep it at multiples of 16px and never bold: anything else blurs its pixels. **Silkscreen** sets `label` only, in capitals: eyebrows, tags and table headers. The **body** face (`system-ui`) sets `body`, `body-strong` and `small`: paragraphs, card titles, buttons, navigation and the footer.
- Never set a sentence in a pixel face.
- Both pixel faces come from Google Fonts but are self-hosted: `fonts` in `astro.config.mjs` downloads them at build time and gives them fallbacks with matching metrics, so text doesn't jump when they load. The body face needs no download.
- Use one `display` per page, `heading-1` for page titles, `heading-2` for sections and `body` for running text. Don't set long copy below 16px. Keep `small` for captions in `ink-muted`.
- Keep sizes on the scale. Pixel faces render sharpest at their set sizes, so don't scale type fluidly.

## Space and shape

- Everything sits on a 4px grid: `space-1` is one pixel-unit. Pad cards with `space-4`, pad panels with `space-8` and separate sections with `space-12`.
- Corners are square by default (`radius-0`). Only tags take `radius-sm` and only buttons and inputs take `radius-md`.
- Separate surfaces with a `hairline` border or a step between surfaces. The system has no shadows.

## Iconography

- No icon set has been chosen yet. Until one is, use simple pixel-grid glyphs drawn on the 4px grid in `ink` or `accent`, and never emoji.
