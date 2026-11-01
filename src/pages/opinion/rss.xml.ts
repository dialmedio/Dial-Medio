import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getEntry } from 'astro:content';
import { columnasPublicadas, sinAcento } from '../../lib/medio';

/** Solo las columnas de opinión. */
export async function GET(context: APIContext) {
  const items = await Promise.all(
    (await columnasPublicadas()).map(async (c) => ({
      title: sinAcento(c.data.titulo),
      description: c.data.bajada,
      pubDate: c.data.fecha,
      link: `/opinion/${c.id}`,
      author: (await getEntry(c.data.autor))?.data.nombre,
    })),
  );
  return rss({
    title: 'Dial · Opinión',
    description: 'Columnas de opinión con firma en Dial.',
    site: context.site!,
    items,
    customData: '<language>es-co</language>',
  });
}
