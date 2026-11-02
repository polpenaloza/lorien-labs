import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    channel: reference('channels'),
    video_url: z.url(),
    summary: z.string(),
    sources: z
      .array(
        z.object({
          title: z.string(),
          url: z.url().optional(),
          type: z.enum(['primary', 'secondary']),
        }),
      )
      .min(1),
    draft: z.boolean().default(false),
  }),
});

const channels = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/channels' }),
  schema: z.object({
    name: z.string(),
    description: z.string(),
    youtube: z.url(),
    instagram: z.url().optional(),
    tiktok: z.url().optional(),
  }),
});

const offers = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/offers' }),
  schema: z.object({
    name: z.string(),
    category: z.enum(['Services', 'Digital products', 'Memberships']),
    description: z.string(),
    price_usd: z.number().min(0).nullish(),
    unit: z.enum(['per hour', 'one-time', 'per month']),
    delivery: z.string(),
    buy_url: z.url().optional(),
    order: z.number().int().default(99),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    updated: z.coerce.date().optional(),
  }),
});

const site = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/site' }),
  schema: z.object({
    legal_name: z.string(),
    entity: z.string(),
    description: z.string(),
    address: z.string(),
    email: z.string(),
    phone: z.string(),
  }),
});

export const collections = { posts, channels, offers, pages, site };
