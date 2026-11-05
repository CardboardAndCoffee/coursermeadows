// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.coursermeadows.com',
  // Old WordPress URLs all end in a slash; keep them identical.
  trailingSlash: 'always',
  build: { format: 'directory' },
});
