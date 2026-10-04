import { site } from '../../site.config.mjs';
export function GET() {
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${site.absolute('sitemap-index.xml')}\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
