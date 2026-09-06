import { buildSite } from '../config/site.ts';
export function GET() {
  return new Response(`User-agent: *\nAllow: /\nSitemap: ${buildSite().origin}/sitemap.xml\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
