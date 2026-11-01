/**
 * El medio (nov 2026): secciones, líneas de noticias y utilidades de redacción.
 * Dial es el medio; la productora es Dial Estudio.
 */
import { getCollection, type CollectionEntry } from 'astro:content';

/** Las líneas de noticias. Cada una tiene su estética en Instagram; en la página comparten la de la casa. */
export const lineas = {
  'al-aire': {
    nombre: 'Al Aire',
    cadencia: 'Todos los días',
    texto: 'Lo que pasa en Colombia, América Latina y el mundo, con contexto: qué pasó, por qué importa y qué dicen las partes.',
  },
  termometro: {
    nombre: 'Termómetro',
    cadencia: 'Lunes y jueves',
    texto: 'Clima y ambiente: denuncias con pruebas, soluciones que ya funcionan y la ciencia detrás de cada cifra.',
  },
  expediente: {
    nombre: 'Expediente',
    cadencia: 'Martes y jueves',
    texto: 'Seguimiento a las decisiones del gobierno De la Espriella, con fuente y fecha. Lo publica la RED Quynza; Dial lo diseña y diagrama.',
  },
  'tecnologia-y-poder': {
    nombre: 'Tecnología y poder',
    cadencia: 'Miércoles',
    texto: 'La política de la tecnología: quién controla los datos, las plataformas y las máquinas que deciden por nosotros.',
  },
  'nuevos-mundos': {
    nombre: 'Nuevos mundos posibles',
    cadencia: 'Viernes',
    texto: 'Salidas que ya existen: experiencias que muestran que otro modelo es posible.',
  },
  'arte-y-memoria': {
    nombre: 'Arte y memoria',
    cadencia: 'Domingos',
    texto: 'Historias del arte y de la memoria que explican el presente.',
  },
} as const;
export type Linea = keyof typeof lineas;

export const regiones = {
  colombia: 'Colombia',
  'america-latina': 'América Latina',
  mundo: 'Mundo',
} as const;

/** Menú principal. Fotografía solo entra cuando hay un ensayo publicado. */
export async function secciones() {
  const fotos = await getCollection('fotografia', (f) => !f.data.borrador);
  return [
    { texto: 'Noticias', href: '/noticias' },
    { texto: 'Opinión', href: '/opinion' },
    { texto: 'Podcast', href: '/podcast' },
    { texto: 'Documentales', href: '/documentales' },
    { texto: 'Laboratorio', href: '/laboratorio' },
    ...(fotos.length ? [{ texto: 'Fotografía', href: '/fotografia' }] : []),
  ];
}

export const rutaNoticia = (n: CollectionEntry<'noticias'>) => `/noticias/${n.data.linea}/${n.id}`;

/** Las noticias publicadas, de la más reciente a la más vieja. */
export async function noticiasPublicadas(filtro?: (n: CollectionEntry<'noticias'>) => boolean) {
  const todas = await getCollection('noticias', (n) => !n.data.borrador && (!filtro || filtro(n)));
  return todas.sort((a, b) => b.data.fecha.valueOf() - a.data.fecha.valueOf() || a.id.localeCompare(b.id));
}

export async function columnasPublicadas() {
  const todas = await getCollection('opinion', (c) => !c.data.borrador);
  return todas.sort((a, b) => b.data.fecha.valueOf() - a.data.fecha.valueOf());
}

/** Rótulo de una noticia: la línea y, en Al Aire, la región o el lugar. */
export const rotulo = (n: CollectionEntry<'noticias'>) => {
  const d = n.data;
  if (d.linea === 'al-aire' && d.region && d.region !== 'colombia') return regiones[d.region];
  return lineas[d.linea].nombre;
};

/** Titular con el acento entre asteriscos → <em>. Escapa el resto. */
export const conAcento = (t: string) =>
  t
    .replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');

export const sinAcento = (t: string) => t.replace(/\*/g, '');

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

/** «1 de noviembre de 2026» */
export const fechaLarga = (d: Date) => `${d.getUTCDate()} de ${MESES[d.getUTCMonth()]} de ${d.getUTCFullYear()}`;
/** «1 nov 2026» */
export const fechaBreve = (d: Date) => `${d.getUTCDate()} ${MESES[d.getUTCMonth()].slice(0, 3)} ${d.getUTCFullYear()}`;
/** «Domingo 1 de noviembre de 2026», en la hora de Bogotá. */
export const fechaDeHoy = (d = new Date()) => {
  const bog = new Date(d.getTime() - 5 * 3600 * 1000);
  const dia = DIAS[bog.getUTCDay()];
  return `${dia[0].toUpperCase()}${dia.slice(1)} ${fechaLarga(bog)}`;
};
export const isoDia = (d: Date) => d.toISOString().slice(0, 10);

/** Minutos de lectura (220 palabras por minuto, redondeado hacia arriba). */
export const lectura = (texto = '') => Math.max(1, Math.ceil(texto.split(/\s+/).filter(Boolean).length / 220));

/** Separa «Medio, fecha: nota» en dos partes, para la lista de fuentes. */
export const partirFuente = (t: string) => {
  const i = t.indexOf(': ');
  return i > 0 && i < 90 ? { medio: t.slice(0, i), nota: t.slice(i + 2) } : { medio: t, nota: '' };
};

/** Ruta de una pieza de video según su formato (antes todo vivía en /medio). */
export const rutaVideo = (m: CollectionEntry<'medio'>) =>
  m.data.formato === 'videopodcast'
    ? `/podcast/${m.id}`
    : m.data.formato === 'documental'
      ? `/documentales/${m.id}`
      : `/laboratorio/${m.id}`;
