// The site's content model, independent of which CMS stores it.
// docs/content-model.md explains each field for editors;
// storyblok/components.json is the same model as Storyblok components.

/** A time of day on a 24-hour clock, "HH:MM" (e.g. "09:00", "19:30"). */
export type ClockTime = `${number}:${number}`;

export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

/** One row of the regular weekly schedule, e.g. Mon–Fri 9:00–19:00. */
export interface HoursRow {
  days: Weekday[];
  opens: ClockTime;
  closes: ClockTime;
}

/** A stretch of days the store is shut, e.g. a holiday. Dates are "YYYY-MM-DD", inclusive. */
export interface Closure {
  from: string;
  to: string;
  label: string;
}

/**
 * How the open/closed indicator is decided.
 * - auto: from the weekly hours and closures
 * - open / closed: forced by the editor, until `overrideUntil` if set
 */
export type StatusOverride = 'auto' | 'open' | 'closed';

export interface SiteSettings {
  farmName: string;
  phone: string;
  email: string;
  address: { street: string; town: string; state: string; zip: string };
  mapUrl?: string;
  facebookUrl?: string;
  /** IANA zone the hours are in. Fixed in code, not editable. */
  timeZone: string;
  hours: HoursRow[];
  /** Short line under the hours, e.g. "Self-serve — pay at the honor box". */
  hoursNote?: string;
  closures: Closure[];
  statusOverride: StatusOverride;
  /** Shown in the status bar while an override is active, e.g. "Closed for the storm". */
  overrideMessage?: string;
  /** ISO date-time. After this, the status goes back to auto. */
  overrideUntil?: string;
}

export type ProductCategory =
  | 'dairy'
  | 'eggs'
  | 'beef'
  | 'pork'
  | 'lamb'
  | 'poultry'
  | 'maple'
  | 'piglets'
  | 'shares';

export type Availability = 'in_stock' | 'limited' | 'sold_out' | 'seasonal' | 'reserve_only';

/** Something sold at the farm store. Display only: there is no cart. */
export interface Product {
  name: string;
  category: ProductCategory;
  /** In dollars. Omit for "call for price". */
  price?: number;
  /** What the price is per, e.g. "lb", "dozen", "quart". */
  unit?: string;
  /** Extra price detail, e.g. "+ $2 jar deposit" or "~4–6 lb each". */
  priceNote?: string;
  availability: Availability;
  /** e.g. "Back in early November". */
  availabilityNote?: string;
}

export type Species = 'cattle' | 'pig';
export type AnimalRole =
  | 'milk_cow'
  | 'brood_cow'
  | 'heifer'
  | 'herd_sire'
  | 'steer'
  | 'oxen_team'
  | 'sow'
  | 'boar'
  | 'gilt';
export type SaleStatus = 'not_for_sale' | 'available' | 'reserved' | 'sold';

/** A named animal: herd members, breeding stock, and livestock listings. */
export interface Animal {
  name: string;
  species: Species;
  role: AnimalRole;
  /** Free text, e.g. "75% Mini Jersey, 25% Dexter". */
  breed?: string;
  /** "YYYY-MM-DD". */
  born?: string;
  color?: string;
  /** Free text, e.g. "A1/A2, Polled, Chondro/PHA Negative". */
  genetics?: string;
  /** Free text, e.g. "40 in at the withers". */
  height?: string;
  description?: RichText;
  photos: Image[];
  saleStatus: SaleStatus;
  price?: number;
}

export type GuideCategory = 'pigs' | 'cattle' | 'oxen' | 'dairy' | 'poultry' | 'general';

/** Long-form husbandry writing. The site's main reading experience. */
export interface Guide {
  title: string;
  slug: string;
  category: GuideCategory;
  /** One or two sentences for the guide index and search results. */
  summary: string;
  heroImage?: Image;
  body: RichText;
  publishedAt: string;
  updatedAt?: string;
  /** Old WordPress path this content came from, for redirects. */
  legacyPath?: string;
}

/** Building blocks an editor can stack on a page. */
export type PageBlock =
  | { type: 'richText'; content: RichText }
  | { type: 'productList'; heading?: string; category: ProductCategory }
  | { type: 'animalList'; heading?: string; species: Species; saleStatus?: SaleStatus[] }
  | { type: 'imageGallery'; images: Image[] }
  | { type: 'callToReserve'; heading: string; text?: string }
  | { type: 'inquiryForm'; formName: 'contact' | 'cattle-waitlist' | 'piglet-waitlist' }
  | { type: 'guideLinks'; heading?: string; category?: GuideCategory };

export interface Page {
  title: string;
  slug: string;
  intro?: string;
  body: PageBlock[];
  seo?: { title?: string; description?: string; image?: Image };
}

export interface Image {
  src: string;
  /** Required: the old site had no alt text on any image. */
  alt: string;
  width?: number;
  height?: number;
}

/**
 * Rich text as stored by the CMS. Kept opaque here; each CMS adapter
 * supplies its own renderer.
 */
export type RichText = unknown;
