// Modelo de contenido del sitio de Dial.
// Todo lo que está en src/content/ se puede editar sin tocar componentes.
import { defineCollection } from 'astro:content';
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

export const collections = { servicios, casos, medio, muestras, equipo };
