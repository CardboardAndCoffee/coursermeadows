// The one place pages get content from. Today it reads local JSON seeded from
// the old site; once the CMS is set up, this module fetches from it instead
// and nothing else in the site has to change.
import type { SiteSettings } from './types';
import siteSettings from '../../data/site-settings.json';

export async function getSiteSettings(): Promise<SiteSettings> {
  return siteSettings as SiteSettings;
}
