# Content model

What the farm can edit, and how it maps to the site. Code source of truth: [`src/lib/content/types.ts`](../src/lib/content/types.ts). Storyblok version: [`storyblok/schema.mjs`](../storyblok/schema.mjs) → `storyblok/components.json`.

Design rule: **anything the farm changes more than once a year is a field, not text in a paragraph.** On the old site, prices, hours, and "SOLD" were typed into prose, which is why they drifted out of date and disagreed with each other.

## `siteSettings` — "Farm info & hours" (one entry)

| Field | Type | Notes |
|---|---|---|
| Store status | dropdown: *Follow the regular hours* / *Show OPEN* / *Show CLOSED* | The override. Defaults to following the hours. |
| Message while overridden | short text | e.g. "Closed today — snowed in". |
| Override ends | date + time, optional | After this the status goes back to normal by itself, so a forgotten override can't stick. |
| Regular weekly hours | list of rows: days (checkboxes), opens, closes (dropdowns in 30-min steps) | Allows different hours on weekends, and split hours. |
| Note under the hours | short text | e.g. "Self-serve — pay at the honor box". |
| Holiday closures | list: message, first day, last day | Shown as "Closed for Thanksgiving" on those days. |
| Farm name, phone, email, address, map link, Facebook | text | Used in the status bar, footer, contact page, and Google data (`LocalBusiness`). |

The time zone is fixed to `America/New_York` in code.

**How "open now" is decided** ([`src/lib/store-status.ts`](../src/lib/store-status.ts)): override (if active) → holiday closure → weekly hours. The site is static, so the status is computed in the visitor's browser and refreshed every minute; the editor never has to republish for the indicator to flip at opening and closing time. Changes to hours or an override *do* need a publish (which triggers a rebuild, ~1 minute).

## `product` — one entry per item in the farm store

| Field | Type | Example |
|---|---|---|
| Name | text | Ground beef |
| Category | dropdown | Beef (dairy, eggs, beef, pork, lamb, poultry, maple syrup, piglets, bulk shares) |
| Price ($) | number, optional | 9 — empty means "call for price" |
| Per | text | lb |
| Price note | text | + $2 jar deposit · ~4–6 lb each |
| Availability | dropdown | In stock / Limited — call ahead / Sold out / Seasonal / By reservation |
| Availability note | text | Back in early November |

Order within a category = order in the CMS folder (drag to reorder). No cart or checkout; every list ends in a "Call to reserve" button.

Source for the first import: about 70 priced items on the old Farm Store, Dairy, Eggs, Bulk Meat, Products List, and IPP For Sale pages (in `migration/content/`). **Most of those prices are from 2019–2020 and need the farm to confirm before import.**

## `animal` — herd members, breeding stock, and livestock for sale

| Field | Type | Example |
|---|---|---|
| Name | text | Daisy |
| Species / Role | dropdowns | Cattle / Milk cow |
| For sale? | dropdown | Not for sale / Available / Reserved / Sold |
| Price ($) | number | shown only when Available |
| Photos | images | |
| About | rich text | |
| Breed, date of birth, color, genetics & testing, height | short fields | "75% Mini Jersey, 25% Dexter", "A1/A2, Chondro/PHA Negative" |

One model drives three pages: *Meet the Herd* (all cattle), *Cows For Sale* (cattle where status is Available/Reserved, optionally Sold), and the breeding stock on *Idaho Pasture Pigs*. Selling an animal = change one dropdown.

## `guide` — long-form husbandry writing

| Field | Type | Notes |
|---|---|---|
| Title | text | |
| Category | dropdown | Pigs, Cattle, Oxen, Dairy, Poultry, General |
| Summary | 1–2 sentences | Guide index card + Google description |
| Main photo | image | |
| Guide text | rich text, with **Photo** (image + caption) and **Tip box** blocks allowed inline | Headings inside become the on-page table of contents |
| Last reviewed | date | Shown as "Updated …" |
| Old website address | text | Set during migration, for redirects |

URL: `/guides/<slug>/`.

## `page` — everything else

Title, intro, and a stack of **sections** the editor can add, remove, and reorder:

| Section | What it shows |
|---|---|
| Text | Rich text |
| Price list | All products in one category |
| Animals | Animals of one species, optionally filtered by sale status |
| Photo gallery | Images |
| Call to reserve | Heading + text + phone button |
| Form | Contact, cattle wait list, or piglet wait list (submitted to Netlify Forms, emailed to the farm) |
| Guide links | Cards for guides, optionally one category |

Plus "Title in Google", "Description in Google", and a share image.

## Images

Alt text is **required** on every image. None of the 235 images on the old site have any, which hurts accessibility and the Lighthouse score. Migration will need a pass to write alt text for the images we keep.
