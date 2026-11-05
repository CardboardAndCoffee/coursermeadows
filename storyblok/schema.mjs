// Storyblok component definitions for the content model in
// src/lib/content/types.ts. Writes storyblok/components.json, which can be
// pushed to a space with the Storyblok CLI (see storyblok/README.md).
// Run: node storyblok/schema.mjs
import { writeFile } from 'node:fs/promises';

const options = (pairs) => pairs.map(([value, name]) => ({ value, name }));

// Editors pick times from a dropdown, every 30 minutes, 5 am to 10 pm.
const times = [];
for (let m = 5 * 60; m <= 22 * 60; m += 30) {
  const hh = String(Math.floor(m / 60)).padStart(2, '0');
  const mm = String(m % 60).padStart(2, '0');
  const h12 = Math.floor(m / 60) % 12 || 12;
  const label = `${h12}${m % 60 ? ':' + mm : ''} ${m < 720 ? 'am' : 'pm'}`;
  times.push([`${hh}:${mm}`, label]);
}

const weekdays = options([
  ['mon', 'Monday'], ['tue', 'Tuesday'], ['wed', 'Wednesday'], ['thu', 'Thursday'],
  ['fri', 'Friday'], ['sat', 'Saturday'], ['sun', 'Sunday'],
]);

const productCategories = options([
  ['dairy', 'Dairy'], ['eggs', 'Eggs'], ['beef', 'Beef'], ['pork', 'Pork'], ['lamb', 'Lamb'],
  ['poultry', 'Poultry'], ['maple', 'Maple syrup'], ['piglets', 'Piglets'], ['shares', 'Bulk shares'],
]);

const guideCategories = options([
  ['pigs', 'Pigs'], ['cattle', 'Cattle'], ['oxen', 'Oxen'], ['dairy', 'Dairy'],
  ['poultry', 'Poultry'], ['general', 'General'],
]);

const saleStatuses = options([
  ['not_for_sale', 'Not for sale'], ['available', 'Available'], ['reserved', 'Reserved'], ['sold', 'Sold'],
]);

let pos = 0;
const field = (type, display_name, extra = {}) => ({ type, display_name, pos: pos++, ...extra });
const fields = (build) => { pos = 0; return build(); };

const components = [
  {
    name: 'site_settings',
    display_name: 'Farm info & hours',
    is_root: true,
    is_nestable: false,
    schema: fields(() => ({
      tab_status: { type: 'tab', display_name: 'Open / closed', keys: ['status_override', 'override_message', 'override_until'] },
      status_override: field('option', 'Store status', {
        required: true,
        default_value: 'auto',
        options: options([
          ['auto', 'Follow the regular hours'],
          ['open', 'Show OPEN (override)'],
          ['closed', 'Show CLOSED (override)'],
        ]),
        description: 'Leave on "Follow the regular hours" unless something unusual is happening.',
      }),
      override_message: field('text', 'Message while overridden', {
        max_length: 80,
        description: 'Shown in the status bar, e.g. "Closed today — snowed in".',
      }),
      override_until: field('datetime', 'Override ends', {
        description: 'Optional. After this, the status goes back to the regular hours by itself.',
      }),
      tab_hours: { type: 'tab', display_name: 'Hours', keys: ['hours', 'hours_note', 'closures'] },
      hours: field('bloks', 'Regular weekly hours', {
        restrict_components: true,
        component_whitelist: ['hours_row'],
        minimum: 1,
      }),
      hours_note: field('text', 'Note under the hours', { max_length: 120 }),
      closures: field('bloks', 'Holiday closures', {
        restrict_components: true,
        component_whitelist: ['closure'],
      }),
      tab_contact: { type: 'tab', display_name: 'Contact', keys: ['farm_name', 'phone', 'email', 'street', 'town', 'state', 'zip', 'map_url', 'facebook_url'] },
      farm_name: field('text', 'Farm name', { required: true }),
      phone: field('text', 'Phone', { required: true }),
      email: field('text', 'Email', { required: true }),
      street: field('text', 'Street address', { required: true }),
      town: field('text', 'Town', { required: true }),
      state: field('text', 'State', { required: true }),
      zip: field('text', 'ZIP', { required: true }),
      map_url: field('text', 'Google Maps link'),
      facebook_url: field('text', 'Facebook page'),
    })),
  },
  {
    name: 'hours_row',
    display_name: 'Hours',
    is_root: false,
    is_nestable: true,
    preview_field: 'opens',
    schema: fields(() => ({
      days: field('options', 'Days', { required: true, options: weekdays }),
      opens: field('option', 'Opens', { required: true, options: options(times) }),
      closes: field('option', 'Closes', { required: true, options: options(times) }),
    })),
  },
  {
    name: 'closure',
    display_name: 'Closure',
    is_root: false,
    is_nestable: true,
    preview_field: 'label',
    schema: fields(() => ({
      label: field('text', 'Message', { required: true, description: 'e.g. "Closed for Thanksgiving"' }),
      from: field('datetime', 'First day closed', { required: true, disable_time: true }),
      to: field('datetime', 'Last day closed', { required: true, disable_time: true }),
    })),
  },
  {
    name: 'product',
    display_name: 'Product',
    is_root: true,
    is_nestable: false,
    preview_field: 'name',
    schema: fields(() => ({
      name: field('text', 'Name', { required: true, description: 'e.g. "Ground beef"' }),
      category: field('option', 'Category', { required: true, options: productCategories }),
      price: field('number', 'Price ($)', { description: 'Leave empty for "call for price".', decimals: 2 }),
      unit: field('text', 'Per', { description: 'e.g. lb, dozen, quart, each' }),
      price_note: field('text', 'Price note', { description: 'e.g. "+ $2 jar deposit" or "~4–6 lb each"' }),
      availability: field('option', 'Availability', {
        required: true,
        default_value: 'in_stock',
        options: options([
          ['in_stock', 'In stock'], ['limited', 'Limited — call ahead'], ['sold_out', 'Sold out'],
          ['seasonal', 'Seasonal'], ['reserve_only', 'By reservation'],
        ]),
      }),
      availability_note: field('text', 'Availability note', { description: 'e.g. "Back in early November"' }),
    })),
  },
  {
    name: 'animal',
    display_name: 'Animal',
    is_root: true,
    is_nestable: false,
    preview_field: 'name',
    schema: fields(() => ({
      name: field('text', 'Name', { required: true }),
      species: field('option', 'Species', { required: true, options: options([['cattle', 'Cattle'], ['pig', 'Pig']]) }),
      role: field('option', 'Role', {
        required: true,
        options: options([
          ['milk_cow', 'Milk cow'], ['brood_cow', 'Brood cow'], ['heifer', 'Heifer'], ['herd_sire', 'Herd sire'],
          ['steer', 'Steer'], ['oxen_team', 'Oxen team'], ['sow', 'Sow'], ['boar', 'Boar'], ['gilt', 'Gilt'],
        ]),
      }),
      sale_status: field('option', 'For sale?', { required: true, default_value: 'not_for_sale', options: saleStatuses }),
      price: field('number', 'Price ($)', { description: 'Only shown when the animal is available.' }),
      photos: field('multiasset', 'Photos', { filetypes: ['images'] }),
      description: field('richtext', 'About'),
      breed: field('text', 'Breed', { description: 'e.g. "75% Mini Jersey, 25% Dexter"' }),
      born: field('datetime', 'Date of birth', { disable_time: true }),
      color: field('text', 'Color'),
      genetics: field('text', 'Genetics & testing', { description: 'e.g. "A1/A2, Polled, Chondro/PHA Negative"' }),
      height: field('text', 'Height', { description: 'e.g. "40 in at the withers"' }),
    })),
  },
  {
    name: 'guide',
    display_name: 'Guide',
    is_root: true,
    is_nestable: false,
    preview_field: 'title',
    schema: fields(() => ({
      title: field('text', 'Title', { required: true }),
      category: field('option', 'Category', { required: true, options: guideCategories }),
      summary: field('textarea', 'Summary', { required: true, max_length: 240, description: 'One or two sentences for the guide list and Google.' }),
      hero_image: field('asset', 'Main photo', { filetypes: ['images'] }),
      body: field('richtext', 'Guide text', { required: true, restrict_components: true, component_whitelist: ['image_block', 'callout'] }),
      updated_at: field('datetime', 'Last reviewed', { disable_time: true, description: 'Shown to readers as "Updated …".' }),
      legacy_path: field('text', 'Old website address', { description: 'Filled in during migration. Leave as is.' }),
    })),
  },
  {
    name: 'page',
    display_name: 'Page',
    is_root: true,
    is_nestable: false,
    schema: fields(() => ({
      title: field('text', 'Title', { required: true }),
      intro: field('textarea', 'Intro'),
      body: field('bloks', 'Sections', {
        restrict_components: true,
        component_whitelist: ['rich_text', 'product_list', 'animal_list', 'image_gallery', 'call_to_reserve', 'inquiry_form', 'guide_links'],
      }),
      seo_title: field('text', 'Title in Google'),
      seo_description: field('textarea', 'Description in Google', { max_length: 160 }),
      seo_image: field('asset', 'Share image', { filetypes: ['images'] }),
    })),
  },
  // Page sections
  { name: 'rich_text', display_name: 'Text', is_nestable: true, is_root: false, schema: fields(() => ({ content: field('richtext', 'Text', { required: true }) })) },
  {
    name: 'product_list', display_name: 'Price list', is_nestable: true, is_root: false,
    schema: fields(() => ({ heading: field('text', 'Heading'), category: field('option', 'Category', { required: true, options: productCategories }) })),
  },
  {
    name: 'animal_list', display_name: 'Animals', is_nestable: true, is_root: false,
    schema: fields(() => ({
      heading: field('text', 'Heading'),
      species: field('option', 'Species', { required: true, options: options([['cattle', 'Cattle'], ['pig', 'Pigs']]) }),
      sale_status: field('options', 'Only show', { options: saleStatuses, description: 'Leave empty to show all.' }),
    })),
  },
  { name: 'image_gallery', display_name: 'Photo gallery', is_nestable: true, is_root: false, schema: fields(() => ({ images: field('multiasset', 'Photos', { required: true, filetypes: ['images'] }) })) },
  {
    name: 'call_to_reserve', display_name: 'Call to reserve', is_nestable: true, is_root: false,
    schema: fields(() => ({ heading: field('text', 'Heading', { required: true }), text: field('textarea', 'Text') })),
  },
  {
    name: 'inquiry_form', display_name: 'Form', is_nestable: true, is_root: false,
    schema: fields(() => ({
      form_name: field('option', 'Which form', {
        required: true,
        options: options([['contact', 'Contact'], ['cattle-waitlist', 'Cattle wait list'], ['piglet-waitlist', 'Piglet wait list']]),
      }),
    })),
  },
  {
    name: 'guide_links', display_name: 'Guide links', is_nestable: true, is_root: false,
    schema: fields(() => ({ heading: field('text', 'Heading'), category: field('option', 'Category', { options: guideCategories }) })),
  },
  // Inside guide rich text
  {
    name: 'image_block', display_name: 'Photo', is_nestable: true, is_root: false,
    schema: fields(() => ({ image: field('asset', 'Photo', { required: true, filetypes: ['images'] }), caption: field('text', 'Caption') })),
  },
  {
    name: 'callout', display_name: 'Tip box', is_nestable: true, is_root: false,
    schema: fields(() => ({ heading: field('text', 'Heading'), text: field('richtext', 'Text', { required: true }) })),
  },
];

await writeFile(new URL('components.json', import.meta.url), JSON.stringify({ components }, null, 2) + '\n');
console.log(`Wrote ${components.length} components to storyblok/components.json`);
