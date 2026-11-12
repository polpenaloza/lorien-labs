# Lorien Labs LLC

Company website: static [Astro](https://astro.build) (Vite comes with it), hosted on Cloudflare, with a [Sveltia CMS](https://github.com/sveltia/sveltia-cms) panel at `/admin`.

Editors sign in at `/admin` with a GitHub token. Saving content creates a commit on `main`, and Cloudflare builds and publishes it.

Code reaches `main` only through squash-merged pull requests, enforced by a repository ruleset. Repository admins can bypass it, and that bypass is what lets the CMS commit directly, so sign in to `/admin` with an admin's token.

## Develop

```bash
pnpm install
pnpm dev
```

| Command             | What it does                                                                        |
| ------------------- | ----------------------------------------------------------------------------------- |
| `pnpm build`        | Builds the site into `dist/`                                                        |
| `pnpm check`        | Type-checks the project and the content                                             |
| `pnpm lint`         | Lints TypeScript, Astro and UnoCSS (ESLint) and CSS (Stylelint)                     |
| `pnpm lint:fix`     | Fixes what the linters can fix on their own                                         |
| `pnpm format`       | Formats everything with Prettier (`format:check` only reports)                      |
| `pnpm test`         | Tests the YouTube link parser                                                       |
| `pnpm check:stripe` | Audits `dist/` against Stripe's website requirements                                |
| `pnpm logo`         | Regenerates the logo files from the pixel grid in `scripts/logo.mjs`                |
| `pnpm scene`        | Redraws the home hero's pixel art layers into `public/scene/` (`scripts/scene.mjs`) |

Every pull request and every push to `main` runs `format:check`, `lint`, `check`, `test` and `build` in GitHub Actions (`.github/workflows/ci.yml`). Content in `src/content/` is left to the CMS's own format, so Prettier skips it.

## Cloudflare

Create a Worker from the `polpenaloza/lorien-labs` GitHub repository (Workers Builds) with these settings:

- Production branch: `main`
- Build command: `pnpm build && pnpm check:stripe`
- Deploy command: `pnpm exec wrangler deploy`

The build fails while `pnpm check:stripe` finds a problem, so a site with `[PENDING: ...]` values never goes live.

## Design

The design system lives in `design/`: `tokens.json` (colours, type, spacing, radii), `README.md` (how to use them) and the logo. `src/styles/tokens.css` is its CSS form, and `uno.config.ts` maps those variables to [UnoCSS](https://unocss.dev) utilities (`bg-surface-200`, `p-4`) and shared shortcuts (`card`, `button`, `label`). Fonts (VT323, Silkscreen) load from Google Fonts in `src/layouts/Base.astro`.

## Content

| Path                             | CMS collection        | Notes                                                           |
| -------------------------------- | --------------------- | --------------------------------------------------------------- |
| `src/content/posts/`             | Blog posts            | One per video: summary, story, analysis, sources (at least one) |
| `src/content/channels/`          | Channels              | A post picks its channel from these                             |
| `src/content/offers/`            | Products and services | Name, price in USD, billing unit, delivery                      |
| `src/content/pages/`             | Pages                 | About, Terms, Privacy, Refunds                                  |
| `src/content/site/business.json` | Business details      | Legal name, address, email, phone                               |

## Stripe requirements

Stripe checks the site at activation and regularly afterwards.

| Requirement                                   | Where                                                                    |
| --------------------------------------------- | ------------------------------------------------------------------------ |
| Business name, matching the Stripe account    | Every page footer and title, plus `/contact` (`business.json`)           |
| Clear description of what is sold             | `/`, `/services`, `/about`                                               |
| Prices with explicit currency                 | `/services`                                                              |
| Customer service contact beyond a form        | `/contact` and every footer: email, phone, address                       |
| Refund, dispute and cancellation policies     | `/refunds`                                                               |
| Delivery policy                               | `/refunds`, plus each offer on `/services`                               |
| Legal or export restrictions, promotion terms | `/terms`                                                                 |
| Privacy policy                                | `/privacy`                                                               |
| Payment security statement, HTTPS             | `/services` and every footer; Cloudflare serves HTTPS                    |
| Public, complete, not under construction      | No password or region blocks; `pnpm check:stripe` rejects pending values |
| Social profiles as full URLs                  | Footer (`channels/`)                                                     |

Accepted card logos are recommended but not required: they belong to the design pass. The Stripe account's statement descriptor (5 to 22 characters) must resemble the business name.

**The policy pages are drafts, not legal advice.** Have them reviewed before going live. Whatever the site says about the business must match what is declared to Stripe.

This repository is public. Never commit an EIN, bank details, tax forms or credentials.
