// Audits the built site against Stripe's website requirements. Run after `pnpm build`.
// https://docs.stripe.com/get-started/checklist/website
// https://support.stripe.com/questions/business-website-for-account-activation-faq
import { existsSync, globSync, readFileSync } from 'node:fs';

const LEGAL_NAME = 'Lorien Labs LLC';
const FOOTER_LINKS = ['/terms', '/privacy', '/refunds', '/contact'];

// What each page must say, as Stripe's reviewers would look for it.
const REQUIRED = {
  'index.html': [/what we sell/i],
  'services/index.html': [/USD \d/, /in US dollars/i, /stripe/i, /delivery/i],
  'contact/index.html': [/href="mailto:[^"\s]+@[^"\s]+"/, /href="tel:\+?[\d\s()-]+"/, /address/i],
  'about/index.html': [/lorien labs/i],
  'terms/index.html': [/promotion/i, /export/i, /governing law/i],
  'privacy/index.html': [/personal data/i, /your rights/i],
  'refunds/index.html': [/refund/i, /cancel/i, /dispute/i, /delivery/i],
  'blog/index.html': [/blog/i],
};

const problems = [];
const read = (path) => readFileSync(`dist/${path}`, 'utf8');

for (const [path, patterns] of Object.entries(REQUIRED)) {
  if (!existsSync(`dist/${path}`)) {
    problems.push(`${path}: page is missing`);
    continue;
  }
  for (const pattern of patterns) {
    if (!pattern.test(read(path))) problems.push(`${path}: does not match ${pattern}`);
  }
}

const pages = globSync('**/*.html', { cwd: 'dist' }).filter((path) => !path.startsWith('admin/'));

for (const path of pages) {
  const html = read(path);
  for (const [pending] of html.matchAll(/\[PENDING[^\]]*\]/g)) problems.push(`${path}: ${pending}`);
  if (!html.includes(LEGAL_NAME)) problems.push(`${path}: does not show "${LEGAL_NAME}"`);
  for (const link of FOOTER_LINKS) {
    if (!html.includes(`href="${link}"`)) problems.push(`${path}: no link to ${link}`);
  }
}

const unique = [...new Set(problems)];
if (unique.length > 0) {
  console.error(`Not ready for Stripe review, ${unique.length} problems:`);
  for (const problem of unique) console.error(`  ${problem}`);
  process.exit(1);
}

console.log(`Stripe website check passed on ${pages.length} pages.`);
