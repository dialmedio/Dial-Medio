// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Dominio definitivo.
const SITE = 'https://dialmedio.org';

export default defineConfig({
  site: SITE,
  trailingSlash: 'ignore',
  devToolbar: { enabled: false },
  i18n: {
    locales: ['es', 'en'],
    defaultLocale: 'es',
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/gracias') && !page.includes('/404'),
      i18n: { defaultLocale: 'es', locales: { es: 'es-CO', en: 'en' } },
    }),
  ],
});
