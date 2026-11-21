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
 * Publicidad aún no tiene comerciales propios: muestra imagen (Feo Palante) y diseño sonoro (Shadow Of The Dragon),
 * sin decir que son anuncios.
 */
export type Pieza =
  | { tipo: 'youtube'; id: string; titulo: string; nota: string }
  | { tipo: 'vertical'; recap: Recap; titulo: string; nota: string }
  | { tipo: 'carrusel'; id: string; nota: string };

const yt = (id: string, titulo: string, nota: string): Pieza => ({ tipo: 'youtube', id, titulo, nota });

export const OBRAS: Record<string, { rotulo: string; piezas: Pieza[]; pie?: string }> = {
  documental: {
    rotulo: 'Hecho por nosotros',
    piezas: [
      yt('ONV3lsPwmPo', 'Los últimos nómadas de Mongolia', 'Cortometraje documental · música original y diseño sonoro'),
      yt('9-pppveOQRs', 'Historia del jazz colombiano en 10 minutos', 'Videoensayo · investigación, dirección y música'),
    ],
  },
  publicidad: {
    rotulo: 'Nuestra imagen y nuestro sonido',
    piezas: [
      yt('1PCgmrlsKUQ', 'Delayn Núñez — Feo Palante', 'Imagen · rodaje y color'),
      yt('6DZmq3vevQ4', 'Shadow Of The Dragon', 'Sonido · música y diseño sonoro para animación'),
    ],
  },
  musica: {
    rotulo: 'Hecho por nosotros',
    piezas: [
      yt('L84B5ZGakjY', 'In-Vitro, sesión en vivo', 'Sesión en vivo · imagen y sonido'),
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
