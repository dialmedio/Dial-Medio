// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// PROVISIONAL: cambiar por el dominio definitivo cuando exista.
const SITE = 'https://dial-web.pages.dev';

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
