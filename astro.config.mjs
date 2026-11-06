// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.coursermeadows.com',
  // Old WordPress URLs all end in a slash; keep them identical.
  trailingSlash: 'always',
  // Photos inside guides get responsive sizes automatically.
  image: { layout: 'constrained' },
  // Inline CSS so the first paint doesn't wait on a separate stylesheet.
  build: { format: 'directory', inlineStylesheets: 'always' },
});
