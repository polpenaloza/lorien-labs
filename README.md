# Lorien Labs LLC

Company website: static [Astro](https://astro.build) (Vite comes with it), hosted on Cloudflare, with a [Sveltia CMS](https://github.com/sveltia/sveltia-cms) panel at `/admin`.

Editors sign in at `/admin` with a GitHub token. Saving content creates a commit on `main`, and Cloudflare builds and publishes it.

## Develop

```bash
pnpm install
pnpm dev
```

| Command | What it does |
| --- | --- |
| `pnpm build` | Builds the site into `dist/` |
| `pnpm check` | Type-checks the project and the content |
| `pnpm test` | Tests the YouTube link parser |
| `pnpm check:stripe` | Audits `dist/` against Stripe's website requirements |
| `pnpm logo` | Regenerates the logo files from the pixel grid in `scripts/logo.mjs` |

## Cloudflare

Create a Worker from the `polpenaloza/lorien-labs` GitHub repository (Workers Builds) with these settings:

- Production branch: `main`
- Build command: `pnpm build && pnpm check:stripe`
- Deploy command: `pnpm exec wrangler deploy`

The build fails while `pnpm check:stripe` finds a problem, so a site with `[PENDING: ...]` values never goes live.

## Design

The design system lives in `design/`: `tokens.json` (colours, type, spacing, radii), `README.md` (how to use them) and the logo. `src/styles/tokens.css` is the CSS form the pages use. Fonts (Pixelify Sans, Silkscreen) load from Google Fonts in `src/layouts/Base.astro`.

## Content

| Path | CMS collection | Notes |
| --- | --- | --- |
| `src/content/posts/` | Blog posts | One per video: summary, story, analysis, sources (at least one) |
| `src/content/channels/` | Channels | A post picks its channel from these |
| `src/content/offers/` | Products and services | Name, price in USD, billing unit, delivery |
| `src/content/pages/` | Pages | About, Terms, Privacy, Refunds |
| `src/content/site/business.json` | Business details | Legal name, address, email, phone |

## Stripe requirements

Stripe checks the site at activation and regularly afterwards.

| Requirement | Where |
| --- | --- |
| Business name, matching the Stripe account | Every page header and footer (`business.json`) |
| Clear description of what is sold | `/`, `/services`, `/about` |
| Prices with explicit currency | `/services` |
| Customer service contact beyond a form | `/contact` and every footer: email, phone, address |
| Refund, dispute and cancellation policies | `/refunds` |
| Delivery policy | `/refunds`, plus each offer on `/services` |
| Legal or export restrictions, promotion terms | `/terms` |
| Privacy policy | `/privacy` |
| Payment security statement, HTTPS | `/services` and every footer; Cloudflare serves HTTPS |
| Public, complete, not under construction | No password or region blocks; `pnpm check:stripe` rejects pending values |
| Social profiles as full URLs | Footer (`channels/`) |

Accepted card logos are recommended but not required: they belong to the design pass. The Stripe account's statement descriptor (5 to 22 characters) must resemble the business name.

**The policy pages are drafts, not legal advice.** Have them reviewed before going live. Whatever the site says about the business must match what is declared to Stripe.

This repository is public. Never commit an EIN, bank details, tax forms or credentials.
