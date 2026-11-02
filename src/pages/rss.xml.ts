import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getEntry } from 'astro:content';
import { noticiasPublicadas, columnasPublicadas, rutaNoticia, sinAcento, lineas } from '../lib/medio';

/** Todo Dial: noticias y columnas, de lo más reciente a lo más viejo. */
export async function GET(context: APIContext) {
  const noticias = (await noticiasPublicadas()).map((n) => ({
    title: sinAcento(n.data.titulo),
    description: n.data.bajada,
    pubDate: n.data.fecha,
    link: rutaNoticia(n),
    categories: [lineas[n.data.linea].nombre],
    author: n.data.firma,
  }));
  const columnas = await Promise.all(
    (await columnasPublicadas()).map(async (c) => ({
      title: sinAcento(c.data.titulo),
      description: c.data.bajada,
      pubDate: c.data.fecha,
      link: `/opinion/${c.id}`,
      categories: ['Opinión'],
      author: (await getEntry(c.data.autor))?.data.nombre,
    })),
  );
  return rss({
    title: 'Dial',
    description: 'Noticias explicadas, columnas de opinión, podcast y documentales desde Bogotá.',
    site: context.site!,
    items: [...noticias, ...columnas].sort((a, b) => b.pubDate.valueOf() - a.pubDate.valueOf()).slice(0, 60),
    customData: '<language>es-co</language>',
  });
}
