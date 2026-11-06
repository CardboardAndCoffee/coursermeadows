// Sitemap for Google. Lists every page except the 404 and the form thank-you
// page, plus one entry per guide. New .astro pages are picked up automatically.
import type { APIRoute } from 'astro';
import { getGuides } from '../lib/content';

const EXCLUDE = new Set(['/404/', '/thanks/']);

const pagePaths = Object.keys(import.meta.glob('./**/*.astro'))
  .filter((file) => !file.includes('['))
  .map((file) => file.replace(/^\.\//, '/').replace(/\.astro$/, '/').replace(/(^|\/)index\/$/, '$1'))
  .filter((path) => !EXCLUDE.has(path));

export const GET: APIRoute = async ({ site }) => {
  const guides = await getGuides();
  const entries = [
    ...pagePaths.map((path) => ({ path, lastmod: undefined as Date | undefined })),
    ...guides.map((g) => ({ path: `/guides/${g.id}/`, lastmod: g.data.updatedAt })),
  ].sort((a, b) => a.path.localeCompare(b.path));

  const urls = entries
    .map(({ path, lastmod }) => {
      const loc = new URL(path, site).href;
      return `  <url><loc>${loc}</loc>${lastmod ? `<lastmod>${lastmod.toISOString().slice(0, 10)}</lastmod>` : ''}</url>`;
    })
    .join('\n');

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
};
