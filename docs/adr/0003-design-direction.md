# 3. Design: Herd Book + Field Guide, prices optional

**Status:** Accepted 2026-11-06 (chosen by the farm)

Three directions were reviewed (`prototypes/three-looks/`). The farm chose a mix of two:

- **Herd Book** for the animals: each cow and pig gets a record card with photo, role, and the details buyers ask about (breed, date of birth, height, milk, genetics and testing). "For sale" pages use the same cards with a sale status.
- **Field Guide** for openers and reading: big farm photos at the top of key pages, and a calm reading layout for guides with a sticky table of contents.

**Farm Stand** (store and price board first) was set aside. The farm doesn't want store prices on the website, because other farms can look them up and undercut them.

## Consequences

- `product.price` is optional and shown only when filled in. At launch no store prices are entered; piglet prices, which the farm already posts, are kept.
- Type: Gloock (headings), Source Serif 4 (text), Archivo Narrow (labels, nav, buttons), IBM Plex Mono (animal record data). All self-hosted, Latin subset only, about 150 KB in total.
- One light theme, chosen on purpose: the site is mostly read on phones, often outdoors.
