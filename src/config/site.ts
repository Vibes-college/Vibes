import { defaultLocale, locales } from '../lib/i18n/routes.ts';

// 验证构建使用的公开站点origin，生产不得回落本机地址。
export function siteConfig(value: string | undefined, production: boolean) {
  if (!value && production) throw new Error('SITE_URL is required for deployment');
  const url = new URL(value || 'http://127.0.0.1:4322');
  if (url.username || url.password || url.search || url.hash || url.pathname !== '/')
    throw new Error('SITE_URL must be an origin without credentials, path, query or fragment');
  const local = ['localhost', '127.0.0.1'].includes(url.hostname);
  if (url.protocol !== 'https:' && !(local && !production && url.protocol === 'http:'))
    throw new Error('SITE_URL must use HTTPS outside local verification');
  if (production && local) throw new Error('Deployment cannot use localhost');
  return { origin: url.origin, name: 'Vibes', defaultLocale, locales };
}
// 从构建环境读取站点配置。
export function buildSite() {
  return siteConfig(process.env.SITE_URL, process.env.VIBES_DEPLOY === '1');
}
