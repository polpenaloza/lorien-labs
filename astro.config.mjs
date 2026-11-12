import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
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

// Astro hashes the scripts it bundles, not inline ones. Base.astro inlines this file verbatim, so its hash
// is computed from the same bytes and can never go stale.
const revealHash = `sha256-${createHash('sha256').update(readFileSync('src/scripts/reveal.js', 'utf8')).digest('base64')}`;

export default defineConfig({
  site: 'https://lorienlabs.dev',
  output: 'static',
  // `/services` builds to services.html, which Cloudflare serves at `/services` as linked. The default
  // services/index.html would answer every link with a 307 to `/services/`.
  build: { format: 'file' },
  integrations: [UnoCSS(), sitemap()],
  fonts: [pixelFont('VT323', '--font-vt323'), pixelFont('Silkscreen', '--font-silkscreen')],
  // Content Security Policy as a <meta> on every page: Astro hashes each script and <style> it emits, so
  // nothing else runs. frame-ancestors can't live in a <meta>; public/_headers sends it.
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        'frame-src https://www.youtube-nocookie.com',
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ],
      // The hero positions its layers with style attributes (--depth, --delay), so style-src-attr allows
      // inline; <style> elements keep their hashes.
      scriptDirective: { hashes: [revealHash] },
      styleDirective: { resources: ["'self'", { resource: "'unsafe-inline'", kind: 'attribute' }] },
    },
  },
});
