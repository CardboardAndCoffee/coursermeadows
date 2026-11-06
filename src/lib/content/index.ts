// The one place pages get content from. Site settings come from local JSON;
// animals, products and guides come from Astro content collections
// (src/content.config.ts). When Storyblok is connected, the collection
// loaders and getSiteSettings change; pages stay the same.
import { getCollection } from 'astro:content';
import type { SiteSettings } from './types';
import siteSettings from '../../data/site-settings.json';
import animalsData from '../../data/animals.json';
import productsData from '../../data/products.json';

// Keep entries in the order the farm listed them (the CMS will do the same).
const position = (list: { id: string }[]) => {
  const index = new Map(list.map((item, i) => [item.id, i]));
  return (a: { id: string }, b: { id: string }) => (index.get(a.id) ?? 0) - (index.get(b.id) ?? 0);
};
const byAnimalOrder = position(animalsData);
const byProductOrder = position(productsData);

export async function getSiteSettings(): Promise<SiteSettings> {
  return siteSettings as SiteSettings;
}

type AnimalFilter = {
  species?: 'cattle' | 'pig';
  roles?: string[];
  saleStatus?: string[];
};

export async function getAnimals(filter: AnimalFilter = {}) {
  const animals = await getCollection('animals', ({ data }) =>
    (!filter.species || data.species === filter.species) &&
    (!filter.roles || filter.roles.includes(data.role)) &&
    (!filter.saleStatus || filter.saleStatus.includes(data.saleStatus)),
  );
  return animals.sort(byAnimalOrder);
}

export async function getProducts(...categories: string[]) {
  const products = await getCollection('products', ({ data }) => categories.length === 0 || categories.includes(data.category));
  return products.sort(byProductOrder);
}

export async function getGuides() {
  const guides = await getCollection('guides');
  return guides.sort((a, b) => a.data.order - b.data.order);
}
