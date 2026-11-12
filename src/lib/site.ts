import { getCollection, getEntry } from 'astro:content';

export async function getBusiness() {
  const entry = await getEntry('site', 'business');
  if (!entry) throw new Error('Missing src/content/site/business.json');
  return entry.data;
}

export async function getPublishedPosts() {
  const posts = await getCollection('posts', ({ data }) => !data.draft);
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

// Content dates are UTC midnight: format them in UTC or they show a day early in the Americas.
export const formatDate = (date: Date) => date.toLocaleDateString('en-US', { dateStyle: 'long', timeZone: 'UTC' });

// The page's public path. With `build.format: 'file'` the build sees `/services.html` and `/index.html`,
// while links, the sitemap and dev use `/services` and `/`.
export const pagePath = (url: URL) => url.pathname.replace(/(index)?\.html$/, '');
