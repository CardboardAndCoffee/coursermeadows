# 2. Astro + Storyblok + Netlify

**Status:** Accepted 2026-11-05 (Astro, Storyblok, Netlify confirmed by the owner).

The visual design is a separate decision. The original A/B/C directions were set aside, and three fresh options (Farm Stand, Herd Book, Field Guide) are with the farm for review; see `prototypes/three-looks/`.

## Site generator: Astro

Content-heavy, mostly static, ships no JavaScript by default (good for Lighthouse), and has official integrations for both candidate CMSs. Small interactive bits, like the status bar, are plain scripts.

## CMS: Storyblok (over Sanity)

The deciding constraint is that a non-technical person must update hours, prices, availability, and guides on their own. Storyblok's visual editor shows the real page and lets them click the thing they want to change. Sanity has stronger structured modeling, but its editing UI is a form, and getting a similar click-on-the-page preview means building and maintaining it ourselves.

The content model is deliberately simple (see `docs/content-model.md`) and is defined CMS-neutrally in `src/lib/content/types.ts`. Pages read content only through `src/lib/content/index.ts`, so switching to Sanity means rewriting that module and the schema, not the site.

**Revisit if:** the guide library grows large enough that cross-referencing, structured sections, or reuse matter more than WYSIWYG editing.

## Hosting: Netlify

Netlify and Vercel both work. Netlify wins on two small things: **Netlify Forms** replaces the three Ninja Forms (contact, cattle wait list, piglet wait list) with no backend and no reCAPTCHA script, and the `_redirects` file is a simple place to hold the ~250 redirects from old WordPress URLs. A Storyblok publish webhook calls a Netlify build hook to rebuild.
