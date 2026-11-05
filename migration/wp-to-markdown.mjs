// Converts the WordPress page export (migration/wp-export/pages.json) into one
// Markdown file per page under migration/content/. The output is the source
// text for importing guides and pages into the CMS, and a record of what the
// old site said. Run with: npm run migrate:wp
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import TurndownService from 'turndown';

const root = new URL('./', import.meta.url);
const pages = JSON.parse(await readFile(new URL('wp-export/pages.json', root), 'utf8'));

const turndown = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-' });
// Beaver Builder wraps everything in layout divs and adds a tracking pixel.
turndown.remove(['script', 'style', 'noscript', 'iframe', 'form']);
turndown.addRule('dropPixel', {
  filter: (node) => node.nodeName === 'IMG' && /pixel\.png$/.test(node.getAttribute('src') ?? ''),
  replacement: () => '',
});
// Old content mixes http:// and https:// upload URLs; normalise so images can be matched to the media export.
const normaliseUrls = (md) => md.replace(/http:\/\/(www\.)?coursermeadows\.com/g, 'https://www.coursermeadows.com');

const decode = (s) =>
  s.replace(/&#0?38;/g, '&').replace(/&#8217;/g, '’').replace(/&#8211;/g, '–').replace(/&amp;/g, '&');

await mkdir(new URL('content/', root), { recursive: true });

for (const page of pages) {
  const path = new URL(page.link).pathname;
  // The REST API returns Beaver Builder content without <p> tags; blank lines
  // are the only paragraph markers, so turn them into breaks before converting.
  const html = page.content_html.replace(/\n[ \t]*\n\s*/g, '<br><br>');
  const body = normaliseUrls(turndown.turndown(html))
    .replace(/ {2}\n {2}\n/g, '\n\n')
    .replace(/^ +$/gm, '')
    .replace(/\[\]\(#\)/g, '') // slideshow prev/next arrows
    .replace(/Notice: JavaScript is required for this content\./g, '<!-- old form (Ninja Forms) was here -->')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  const frontmatter = [
    '---',
    `title: ${JSON.stringify(decode(page.title) || 'Home')}`,
    `wpId: ${page.id}`,
    `legacyPath: ${JSON.stringify(path)}`,
    `wpModified: ${JSON.stringify(page.modified)}`,
    '---',
  ].join('\n');
  const name = page.slug || 'home';
  await writeFile(new URL(`content/${name}.md`, root), `${frontmatter}\n\n${body}\n`);
  console.log(`${path.padEnd(32)} -> migration/content/${name}.md`);
}
