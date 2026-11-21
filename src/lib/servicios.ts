/**
 * Servicios (21 nov 2026): cada uno tiene su página en /servicios/<slug> para que Google la muestre
 * cuando alguien busca ese servicio. /servicios sigue siendo el resumen de todos.
 */
import type { CollectionEntry } from 'astro:content';
import { RECAPS, type Recap } from './eventos';

export const rutaServicio = (s: CollectionEntry<'servicios'>) => `/servicios/${s.data.ruta}`;

/**
 * Trabajo nuestro junto a cada servicio (19 nov 2026; reorganizado el 21 nov). Las productoras grandes muestran
 * obra, no listas. Reglas del 21 nov: ninguna pieza se repite entre servicios en /servicios, y cada servicio muestra
 * lo que de verdad corresponde a lo que ofrece. Las piezas van en una tira de igual altura (TiraObra.astro), así un
 * video vertical y uno horizontal quedan proporcionados entre sí.
 * Publicidad aún no tiene comerciales propios: muestra diseño sonoro (Shadow Of The Dragon) y cortes verticales para
 * redes, sin decir que son anuncios. Feo Palante es videoclip: va solo en Videoclips (Martín, 21 nov).
 * Documental: Mongolia, Currulao (Pacífico) y el jazz (Martín pidió el Currulao, 21 nov).
 */
export type Pieza =
  | { tipo: 'youtube'; id: string; titulo: string; nota: string; vertical?: boolean }
  | { tipo: 'vertical'; recap: Recap; titulo: string; nota: string }
  | { tipo: 'carrusel'; id: string; nota: string };

const yt = (id: string, titulo: string, nota: string, vertical = false): Pieza => ({ tipo: 'youtube', id, titulo, nota, vertical });

export const OBRAS: Record<string, { rotulo: string; piezas: Pieza[]; pie?: string }> = {
  documental: {
    rotulo: 'Hecho por nosotros',
    piezas: [
      yt('ONV3lsPwmPo', 'Los últimos nómadas de Mongolia', 'Cortometraje documental · música original y diseño sonoro'),
      yt('17IYYByXjKk', 'Currulao y músicas del Pacífico Sur', 'Documental · viaje por el Pacífico colombiano'),
      yt('9-pppveOQRs', 'Historia del jazz colombiano en 10 minutos', 'Videoensayo · investigación, dirección y música'),
    ],
  },
  publicidad: {
    rotulo: 'Nuestro sonido y nuestros cortes para redes',
    piezas: [
      yt('6DZmq3vevQ4', 'Shadow Of The Dragon', 'Música y diseño sonoro para animación'),
      yt('0Uo3wjuU4HU', '¿El emprendimiento en Colombia es una mentira?', 'Corte vertical para redes', true),
      yt('2oto-eJiXfg', '¿Emprender por elección o por necesidad?', 'Corte vertical para redes', true),
    ],
  },
  musica: {
    rotulo: 'Hecho por nosotros',
    piezas: [
      yt('L84B5ZGakjY', 'In-Vitro, sesión en vivo', 'Sesión en vivo · imagen y sonido'),
      yt('1PCgmrlsKUQ', 'Delayn Núñez — Feo Palante', 'Videoclip · rodaje y color'),
      yt('5lgpy6H5sTU', 'Arrabal Gentío — Mangorito', 'Videoclip · música, guion y producción'),
      yt('tt3X0UynmCk', 'In-Vitro Live Sessions', 'Sesión íntima en nuestro espacio'),
    ],
  },
  eventos: {
    rotulo: 'Hecho por nosotros',
    piezas: [
      yt('lWeFYIvic5Q', 'Un progresista de mano dura frente a siete conservadores', 'Debate en vivo · producción y cobertura multicámara'),
      { tipo: 'vertical', recap: RECAPS[0], titulo: 'Joyce Rivas en el Museo Nacional', nota: 'Recap vertical para redes' },
      { tipo: 'vertical', recap: RECAPS[1], titulo: 'Anguley Isaza en el Museo Nacional', nota: 'Recap vertical para redes' },
    ],
    pie: 'Los recaps cubren las clases a las puertas del Museo Nacional durante los plantones por la censura de piezas del museo, 2026.',
  },
  divulgacion: {
    rotulo: 'Hecho por nosotros',
    piezas: [
      yt('1z-0Il0n8xE', 'Lo que la gente quiere es vivir, episodio 1', 'Videopodcast con la RED Quynza'),
      { tipo: 'carrusel', id: 'bosque-guaviare', nota: 'Un estudio de Plos One, en láminas' },
      { tipo: 'carrusel', id: 'cien-dias', nota: 'Seguimiento de la RED Quynza, en láminas' },
    ],
  },
};

/** Carruseles de diseño en /servicios (los de datos van en Divulgación); la página del servicio muestra todos. */
export const CARRUSELES_RESUMEN = ['quintin-lame', 'museo-nacional', 'algoritmo', 'cero-focos'];
