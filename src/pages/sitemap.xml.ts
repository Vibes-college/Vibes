import { works, workPath } from '../data/works';
// 生成网站的搜索引擎地址清单。
export function GET() {
  const paths = ['/', ...works.map((work) => workPath(work.slug))];
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((path) => `<url><loc>https://vibes-explore.jachi2.chatgpt.site${path}</loc></url>`).join('')}</urlset>`,
    { headers: { 'Content-Type': 'application/xml' } },
  );
}
