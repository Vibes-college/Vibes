import { defaultLocale, locales } from '../lib/i18n/routes.ts';

export function siteConfig(value: string | undefined, production: boolean) {
  if (!value && production) throw new Error('SITE_URL is required for deployment');
  const url = new URL(value || 'http://127.0.0.1:4322');
  if (url.username || url.password || url.search || url.hash || url.pathname !== '/')
    throw new Error('SITE_URL must be an origin without credentials, path, query or fragment');
  const local = ['localhost', '127.0.0.1'].includes(url.hostname);
  if (url.protocol !== 'https:' && !(local && !production && url.protocol === 'http:'))
    throw new Error('SITE_URL must use HTTPS outside local verification');
  if (
    production &&
    (local || url.hostname === 'vibes.college' || url.hostname.endsWith('.vibes.college'))
  )
    throw new Error(
      'Deployment must use an independent test origin, not localhost or vibes.college',
    );
  return { origin: url.origin, name: 'Vibes', defaultLocale, locales };
}
export function buildSite() {
  return siteConfig(process.env.SITE_URL, process.env.VIBES_DEPLOY === '1');
}
