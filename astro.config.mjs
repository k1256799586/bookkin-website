import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { site } from './site.config.mjs';

export default defineConfig({
  output: 'static',
  devToolbar: { enabled: false },
  site: site.origin,
  base: site.base,
  trailingSlash: 'always',
  integrations: [sitemap({ filter: (page) => !page.endsWith('/404/') })],
});
