// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Dominio definitivo.
const SITE = 'https://dialmedio.org';

export default defineConfig({
  site: SITE,
  trailingSlash: 'never',
  devToolbar: { enabled: false },
  i18n: {
    locales: ['es', 'en'],
    defaultLocale: 'es',
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    sitemap({
      filter: (page) => !['/gracias', '/404', '/bienvenida'].some((r) => page.includes(r)),
      i18n: { defaultLocale: 'es', locales: { es: 'es-CO', en: 'en' } },
    }),
  ],
});
