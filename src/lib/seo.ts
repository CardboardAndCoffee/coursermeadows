// Structured data so Google can show the farm's hours, address, and phone.
import type { SiteSettings, Weekday } from './content/types';

const SCHEMA_DAYS: Record<Weekday, string> = {
  mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday',
  fri: 'Friday', sat: 'Saturday', sun: 'Sunday',
};

export function farmJsonLd(s: SiteSettings, site: URL) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: s.farmName,
    url: site.href,
    telephone: s.phone,
    email: s.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: s.address.street,
      addressLocality: s.address.town,
      addressRegion: s.address.state,
      postalCode: s.address.zip,
      addressCountry: 'US',
    },
    openingHoursSpecification: s.hours.map((row) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: row.days.map((d) => SCHEMA_DAYS[d]),
      opens: row.opens,
      closes: row.closes,
    })),
    sameAs: s.facebookUrl ? [s.facebookUrl] : undefined,
  };
}
