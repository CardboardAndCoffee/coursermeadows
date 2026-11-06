# Content map: old coursermeadows.com → new site

Crawled 2026-11-05 from the WordPress REST API (`/wp-json/wp/v2/pages`, `/media`) and the All in One SEO sitemaps. Raw data is in [`migration/wp-export/`](../migration/wp-export/); a Markdown copy of every page is in [`migration/content/`](../migration/content/) (regenerate with `npm run migrate:wp`).

## What the old site actually is

- **20 published pages, 0 blog posts.** There is no blog. Everything, including the husbandry writing, lives in WordPress *pages* built with Beaver Builder.
- **235 images** in the media library (225 JPEG, 10 PNG). **None have alt text.** Each image also has its own WordPress "attachment page" URL, which we redirect.
- **WooCommerce is already gone.** The products API returns 404, and `/shop/` and `/product/*` return 404. Cart, checkout, and account pages are still published but empty.
- **Plugins to replace:** Ninja Forms + reCAPTCHA (contact form and the cow and piglet wait-list forms), Mailchimp for WP (newsletter signup on the homepage), a Google Maps embed on Contact.
- **Theme:** Storefront (WooCommerce's default theme).

### The guide content is smaller than expected

The handoff treats the husbandry guides as the site's main asset. In practice there is **one real guide** and several shorter explainers:

| Content | Where it lives now | Size | Kind |
|---|---|---|---|
| **Tips for successfully raising IPPs** (wallows, rotational grazing, fencing, housing, feeding) | Bottom half of `/idaho-pasture-pigs/` | ~1,000 words | **Guide.** Practical, evergreen, the strongest writing on the site |
| Why we raise Idaho Pasture Pigs | Top of `/idaho-pasture-pigs/` | ~200 words | Breed explainer |
| Why small-breed / mini cattle | Top of `/meet-the-herd/` | ~200 words | Breed explainer |
| Training oxen teams | `/mini-cows/` | ~190 words | Breed explainer |
| Raw milk and yogurt practices (testing, feed, grazing) | `/dairy/` | ~300 words | Product explainer |
| Grass-fed beef shares, pastured broilers | `/bulk-meat/` | ~400 words | Product explainer |
| Buying cattle from us (training, testing, transport) | Top of `/cows-for-sale/` | ~100 words | Sales policy |

**Recommendation:** pull the IPP tips out into a stand-alone guide at `/guides/raising-idaho-pasture-pigs/`, and treat the breed explainers as guides too (short ones are fine). That gives a `/guides/` section of about 4–6 pieces at launch, with room to grow. The farm should know that "preserve and elevate the guides" mostly means elevating this one piece and giving them a place to write more.

## Page-by-page disposition

Rule: **every content URL keeps its path** unless there's a reason to move it. Commerce pages go away and redirect to `/farm-store/`.

| Old URL | Title | Last edited | New home | Notes |
|---|---|---|---|---|
| `/` | (Home) | 2024-11 | `/` | Rebuild. Hours text moves into `siteSettings`. |
| `/farm-store/` | Farm Store | 2020-04 | `/farm-store/` | Built from `product` entries. **Prices are not shown** (the farm's choice; see content model); the list says what's carried and invites a call. |
| `/dairy/` | Dairy | 2020-04 | `/dairy/` | Explainer text + live dairy products. |
| `/eggs/` | Eggs | 2020-04 | **301 → `/farm-store/`** | Only a few lines. Eggs are listed with dairy on the farm store page. |
| `/bulk-meat/` | Bulk Meat | 2020-05 | `/bulk-meat/` | Beef shares + broilers. Says "Fall 2020" and links to `/shop/` (dead). Rewrite dates; CTA becomes "call to reserve". |
| `/meet-the-herd/` | Meet The Herd | 2024-11 | `/meet-the-herd/` | Built from `animal` entries (9 cows, 7 sires). |
| `/cows-for-sale/` | Cows For Sale | 2024-07 | `/cows-for-sale/` | Built from `animal` entries with a sale status. **Every listing is SOLD** and most are from 2019–2020. Needs an empty state ("Nothing available right now — call to join the wait list"). |
| `/idaho-pasture-pigs-for-sale/` | Idaho Pasture Pigs For Sale | 2026-07 | `/idaho-pasture-pigs-for-sale/` | The one page kept current (Spring/Summer 2026 prices). Prices become `product` entries; the wait-list form becomes a Netlify form. |
| `/idaho-pasture-pigs/` | Idaho Pasture Pigs | 2024-10 | `/idaho-pasture-pigs/` + **new** `/guides/raising-idaho-pasture-pigs/` | Split. Breed intro + breeding stock stay here; the tips move to the guide, with a prominent link both ways. **Breeding-stock bios are stale** ("next litter expected March 2022"). |
| `/mini-cows/` | Mini Oxen | 2020-04 | **301 → `/guides/mini-oxen/`** | Slug and title disagreed. The text is now the "Mini cattle as oxen" guide. |
| `/contact/` | Contact Us | 2021-10 | `/contact/` | Address/phone/email come from `siteSettings`. Netlify form replaces Ninja Forms. Keep the map, but as a static image or click-to-load so it doesn't hurt Lighthouse. |
| `/privacy-policy/` | Privacy Policy | 2020-04 | `/privacy-policy/` | Old text is e-commerce boilerplate. Needs a short rewrite (forms + newsletter only). |
| `/terms-conditions/` | Terms & Conditions | 2020-04 | **301 → `/`** | Online-store terms; no longer apply. *(Owner to confirm.)* |
| `/online-store/` | Online Store | 2024-02 | **301 → `/farm-store/`** | The "we closed the online store" notice. |
| `/products-list/` | Products List | 2020-04 | **301 → `/farm-store/`** | "Available this week at Alprilla" — a 2020 weekly list for another outlet. *(Ask the farm whether Alprilla still matters.)* |
| `/alprilla-order-page/` | Alprilla Order Page | 2020-10 | **301 → `/farm-store/`** | WooCommerce shortcodes only. |
| `/cart/` | Cart | 2020-04 | **301 → `/farm-store/`** | |
| `/checkout/` | Checkout | 2020-04 | **301 → `/farm-store/`** | |
| `/my-account/` | My Account | 2020-04 | **301 → `/farm-store/`** | Linked from the old top bar. |
| `/paypal-order-complete/` | PayPal Order Complete | 2020-04 | **301 → `/farm-store/`** | |
| `/shop/`, `/product/*`, `/product-category/*` | (WooCommerce, already 404) | — | **301 → `/farm-store/`** | Catches old inbound links, e.g. from `/bulk-meat/`. |
| `/category/*`, `/feed/` | WordPress system pages | — | **301 → `/`** | |
| `/sitemap_index.xml`, `/page-sitemap.xml`, `/post-sitemap.xml` | All in One SEO sitemaps | — | **301 → `/sitemap.xml`** | The new sitemap is built from the pages and guides. |
| 235 attachment pages, e.g. `/meet-the-herd/fern-on-pasture/` | Image pages | — | **301 → parent page** (or `/` if the image had no parent) | Generated from `migration/wp-export/attachments.json`. |

New pages with no old equivalent: `/guides/` (index), `/guides/raising-idaho-pasture-pigs/`, `/guides/mini-oxen/`, `/thanks/` (after a form is sent), and a 404 page.

All redirects are generated into `public/_redirects` by `npm run redirects` (see [`migration/build-redirects.mjs`](../migration/build-redirects.mjs)).

## Navigation today

The old main menu, for reference (note the duplicates and the mismatch between "Mini Cows" and its target):

- Home
- Livestock For Sale → Cows For Sale, Idaho Pasture Pigs For Sale
- Mini Cows → Meet The Herd, Mini Oxen
- Idaho Pasture Pigs
- Contact Us
- Online Store

Top bar: Terms & Conditions, Privacy Policy, My Account.

## Facts found on the site

| Fact | Value | Where |
|---|---|---|
| Address | 163 Connors Mill Road, Warner, NH 03278 | `/contact/`, `/farm-store/` |
| Phone | 603-456-2164 | `/contact/`, `/online-store/` |
| Email | coursermeadows@gmail.com | `/contact/` |
| Facebook | facebook.com/coursermeadows | footer |
| Hours | **Conflicting:** "open daily 9am – 7pm" (home, online-store, 2024) vs "7 days a week from 8am-8pm" (farm-store, 2020) | — |

The hours conflict is the clearest argument for `siteSettings`: hours are typed in one place and every page reads them from there.

## Questions for the farm

1. What are the current farm-store hours? Do they change by season?
2. Can you send a current price list? (Everything on `/farm-store/` is from 2019–2020.)
3. Is Alprilla still an outlet? If not, `/products-list/` and `/alprilla-order-page/` just redirect.
4. Which breeding sows and boars are current? (The IPP page describes litters through early 2022.)
5. Keep the sold cow listings as a "past sales" record, or remove them?
6. Is the Mailchimp newsletter still in use? If yes, we keep a signup form that posts to Mailchimp.
7. OK to drop Terms & Conditions?
