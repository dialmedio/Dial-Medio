// Modelo de contenido del sitio de Dial.
// Todo lo que está en src/content/ se puede editar sin tocar componentes.
import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const video = z.object({
  plataforma: z.enum(['youtube', 'vimeo']).default('youtube'),
  id: z.string(),
  // Miniatura propia (obligatoria para Vimeo; opcional en YouTube).
  miniatura: z.string().optional(),
  vertical: z.boolean().default(false),
});

/** Paquetes de servicio de Dial Impacto y Dial Encuentros. */
const servicios = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/servicios' }),
  schema: z.object({
    titulo: z.string(),
    linea: z.enum(['impacto', 'encuentros']),
    orden: z.number(),
    // Frase corta y destacada que resume el servicio.
    gancho: z.string().optional(),
    resumen: z.string(),
    paraQuien: z.string(),
    incluye: z.array(z.string()),
    entregables: z.array(z.string()),
  }),
});

/**
 * Casos por encargo. `vitrina` decide en qué portafolio aparece:
 * nunca se mezclan impacto, encuentros y celebraciones.
 */
const casos = defineCollection({
  loader: glob({ pattern: '**/index.md', base: './src/content/casos', generateId: ({ entry }) => entry.split('/')[0] }),
  schema: ({ image }) =>
    z.object({
      titulo: z.string(),
      vitrina: z.enum(['impacto', 'encuentros', 'celebraciones']),
      servicio: z.string().optional(),
      organizacion: z.string().optional(),
      lugar: z.string(),
      anio: z.number(),
      resumen: z.string(),
      video: video.optional(),
      portada: image().optional(),
      galeria: z.array(image()).default([]),
      medicion: z
        .object({ indicador: z.string(), antes: z.number(), despues: z.number(), escala: z.string().default('1 a 10') })
        .optional(),
      destacado: z.boolean().default(false),
      // true = no se publica. Útil para ir armando casos.
      borrador: z.boolean().default(false),
    }),
});

/** Obra propia de Dial Medio: debates, videopodcast, documentales y clips. */
const medio = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/medio' }),
  schema: z.object({
    titulo: z.string(),
    formato: z.enum(['debate', 'videopodcast', 'documental', 'clip']),
    serie: z.string().optional(),
    fecha: z.coerce.date(),
    duracion: z.string().optional(),
    lugar: z.string().optional(),
    resumen: z.string(),
    video: video.optional(),
    capitulos: z.array(z.object({ tiempo: z.string(), titulo: z.string() })).default([]),
    participantes: z.array(z.object({ grupo: z.string(), nombres: z.array(z.string()) })).default([]),
    estado: z.enum(['publicado', 'en-preparacion', 'en-posproduccion']).default('publicado'),
    // Aparece también en la vitrina de Dial Impacto como muestra de oficio.
    mostrarEnImpacto: z.boolean().default(false),
    destacado: z.boolean().default(false),
    orden: z.number().default(100),
    borrador: z.boolean().default(false),
  }),
});

/** Muestras de oficio (música original, diseño sonoro, imagen). */
const muestras = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/muestras' }),
  schema: z.object({
    titulo: z.string(),
    disciplinas: z.array(z.string()),
    rol: z.string(),
    anio: z.number(),
    video: video,
    orden: z.number().default(100),
    borrador: z.boolean().default(false),
  }),
});

/** Personas de Dial. */
const equipo = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/equipo' }),
  schema: ({ image }) =>
    z.object({
      nombre: z.string(),
      rol: z.string(),
      bio: z.string(),
      foto: image().optional(),
      orden: z.number().default(100),
    }),
});

/* ---------- El medio (nov 2026): noticias, opinión, autores y fotografía ---------- */

const enlace = z.object({ texto: z.string(), url: z.string().nullable().optional() });
/** Fe de erratas: se muestra al final de la pieza. */
const correccion = z.object({ fecha: z.coerce.date(), texto: z.string() });

/**
 * Noticias de las líneas de Al Aire. Cada pieza es una carpeta con index.md, portada.jpg y laminas/.
 * Se arman con scripts/importar_noticias.py a partir de lo que ya salió en Instagram; después se pueden
 * corregir a mano. El cuerpo del .md es el texto completo.
 */
const noticias = defineCollection({
  loader: glob({ pattern: '*/index.md', base: './src/content/noticias', generateId: ({ entry }) => entry.split('/')[0] }),
  schema: ({ image }) =>
    z.object({
      // El acento va entre asteriscos (*así*) y sale en cursiva, como en la portada de la lámina.
      titulo: z.string(),
      bajada: z.string(),
      linea: z.enum(['al-aire', 'termometro', 'expediente', 'tecnologia-y-poder', 'nuevos-mundos', 'arte-y-memoria']),
      // Solo Al Aire: de dónde es la noticia.
      region: z.enum(['colombia', 'america-latina', 'mundo']).optional(),
      lugar: z.string().optional(),
      fecha: z.coerce.date(),
      actualizado: z.coerce.date().optional(),
      formato: z.enum(['carrusel', 'breve', 'video']).default('carrusel'),
      serie: z.object({ nombre: z.string(), parte: z.number(), de: z.number() }).optional(),
      portada: image(),
      portadaCredito: z.string().optional(),
      portadaAlt: z.string().optional(),
      // object-position de la portada (p. ej. "50% 35%") para que el recorte no corte lo importante.
      foco: z.string().default('50% 50%'),
      laminas: z.array(image()).default([]),
      pregunta: z.string().optional(),
      firma: z.string().default('Redacción Dial'),
      firmaEnlace: z.string().optional(),
      coproduccion: z.string().optional(),
      periodo: z.string().optional(),
      numero: z.coerce.number().optional(),
      fuentes: z.array(enlace).default([]),
      creditos: z.array(enlace).default([]),
      correcciones: z.array(correccion).default([]),
      destacado: z.boolean().default(false),
      borrador: z.boolean().default(false),
    }),
});

/** Quienes firman en Dial: columnistas, invitados y la dirección. El retrato va en trama (scripts/recorte_trama.py). */
const autores = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/autores' }),
  schema: ({ image }) =>
    z.object({
      nombre: z.string(),
      // Una línea: qué hace, desde dónde escribe.
      rol: z.string(),
      bio: z.string(),
      retrato: image().optional(),
      redes: z.array(z.object({ nombre: z.string(), url: z.string() })).default([]),
      orden: z.number().default(100),
    }),
});

/**
 * Columnas de opinión. Un archivo por columna (o carpeta con index.md si lleva imágenes).
 * Ver src/content/opinion/_plantilla.md. Los archivos que empiezan por _ no se publican.
 */
const opinion = defineCollection({
  loader: glob({ pattern: ['**/[!_]*.md', '!**/_*/**'], base: './src/content/opinion' }),
  schema: ({ image }) =>
    z.object({
      titulo: z.string(),
      bajada: z.string(),
      autor: reference('autores'),
      fecha: z.coerce.date(),
      tema: z.string().optional(),
      imagen: image().optional(),
      imagenCredito: z.string().optional(),
      // Una frase de la columna para destacar en la portada y al compartir.
      destacada: z.string().optional(),
      correcciones: z.array(correccion).default([]),
      borrador: z.boolean().default(false),
    }),
});

/** Ensayos fotográficos. La sección aparece en el menú cuando hay al menos uno. */
const fotografia = defineCollection({
  loader: glob({ pattern: '*/index.md', base: './src/content/fotografia', generateId: ({ entry }) => entry.split('/')[0] }),
  schema: ({ image }) =>
    z.object({
      titulo: z.string(),
      bajada: z.string(),
      autor: reference('autores').optional(),
      fotografo: z.string().optional(),
      lugar: z.string().optional(),
      fecha: z.coerce.date(),
      portada: image(),
      fotos: z.array(z.object({ src: image(), pie: z.string().optional() })).default([]),
      borrador: z.boolean().default(false),
    }),
});

export const collections = { servicios, casos, medio, muestras, equipo, noticias, autores, opinion, fotografia };
