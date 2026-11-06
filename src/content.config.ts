// Content collections. Today they load local files seeded from the old site;
// when Storyblok is connected, each loader is swapped for one that reads from
// the CMS and the schemas stay the same. Keep in sync with
// src/lib/content/types.ts and storyblok/schema.mjs.
import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

const photo = <T extends z.ZodType>(src: T) =>
  z.object({ src, alt: z.string().min(1, 'Every photo needs alt text') });

const animals = defineCollection({
  loader: file('src/data/animals.json'),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      species: z.enum(['cattle', 'pig']),
      role: z.enum(['milk_cow', 'brood_cow', 'heifer', 'herd_sire', 'steer', 'oxen_team', 'sow', 'boar', 'gilt']),
      saleStatus: z.enum(['not_for_sale', 'available', 'reserved', 'sold']),
      price: z.number().optional(),
      breed: z.string().optional(),
      born: z.string().optional(),
      color: z.string().optional(),
      genetics: z.string().optional(),
      height: z.string().optional(),
      milk: z.string().optional(),
      summary: z.string(),
      photo: photo(image()),
    }),
});

const products = defineCollection({
  loader: file('src/data/products.json'),
  schema: z.object({
    name: z.string(),
    category: z.enum(['dairy', 'eggs', 'beef', 'pork', 'lamb', 'poultry', 'maple', 'piglets', 'shares']),
    // Optional on purpose: the farm decides per item whether a price is shown.
    price: z.number().optional(),
    unit: z.string().optional(),
    priceNote: z.string().optional(),
    availability: z.enum(['in_stock', 'limited', 'sold_out', 'seasonal', 'reserve_only']),
    availabilityNote: z.string().optional(),
  }),
});

const guides = defineCollection({
  loader: glob({ pattern: '**/*.md', base: 'src/content/guides' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      category: z.enum(['pigs', 'cattle', 'oxen', 'dairy', 'poultry', 'general']),
      summary: z.string().max(240),
      hero: photo(image()),
      updatedAt: z.coerce.date(),
      legacyPath: z.string().optional(),
      order: z.number().default(99),
    }),
});

export const collections = { animals, products, guides };
