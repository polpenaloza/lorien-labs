import sitemap from '@astrojs/sitemap';
import { defineConfig, fontProviders } from 'astro/config';
import UnoCSS from 'unocss/astro';

// Pixel faces for short, large text (design/README.md). Downloaded at build time and served from this
// site, so no render-blocking request to Google; the fallbacks get metrics tuned to the real faces.
const pixelFont = (name, cssVariable) => ({
  provider: fontProviders.google(),
  name,
  cssVariable,
  weights: [400],
  styles: ['normal'],
  fallbacks: ['ui-monospace', 'monospace'],
});

export default defineConfig({
  site: 'https://lorienlabs.dev',
  output: 'static',
  // `/services` builds to services.html, which Cloudflare serves at `/services` as linked. The default
  // services/index.html would answer every link with a 307 to `/services/`.
  build: { format: 'file' },
  integrations: [UnoCSS(), sitemap()],
  fonts: [pixelFont('VT323', '--font-vt323'), pixelFont('Silkscreen', '--font-silkscreen')],
});
