# coursermeadows.com

Rebuild of [coursermeadows.com](https://www.coursermeadows.com) (WordPress/WooCommerce) as a static Astro site with a headless CMS. The online store is closed; the new site is a brochure built around visiting the farm store and calling to reserve.

## Status

| | |
|---|---|
| Done | Full site built in the chosen design (Herd Book + Field Guide mix, [ADR 3](docs/adr/0003-design-direction.md)): 13 pages, 2 guides, forms, redirects for every old URL · Lighthouse mobile 90–100 on every page · [content map](docs/content-map.md) · [content model](docs/content-model.md) |
| Decided | Astro + Storyblok + Netlify ([ADR 2](docs/adr/0002-astro-storyblok-netlify.md)) |
| Waiting on the farm | Answers to the [questions for the farm](docs/questions-for-the-farm.md), especially hours and which animals are current |
| Next | Create the Storyblok space and swap the content loaders · Netlify site + publish webhook · editor guide |

## Commands

```bash
npm install          # Node 22
npm run dev          # local site at http://localhost:4321
npm test             # unit tests (open/closed logic)
npm run check        # type-check
npm run build        # static site in dist/
npm run migrate:wp   # re-export old WordPress pages to migration/content/*.md
npm run redirects    # regenerate public/_redirects from the content map
```

## Layout

- `src/lib/content/`: content types and the single loader every page uses (local JSON today, CMS later)
- `src/lib/store-status.ts`: decides "Open now / Closed" from hours, closures, and the override
- `src/components/StatusBar.astro`: the sticky bar on every page
- `src/data/`: seed content taken from the old site
- `storyblok/`: CMS component definitions
- `migration/`: WordPress export, converted Markdown, redirect generator
- `docs/`: content map, content model, decision records
- `prototypes/`: design references (not production code)
