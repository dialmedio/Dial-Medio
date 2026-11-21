/**
 * Cubrimiento de eventos sociales (21 nov 2026): dos recaps verticales de las clases que dieron Joyce Rivas y
 * Anguley Isaza en el Museo Nacional durante los plantones por la censura de piezas del museo.
 * Los videos están en public/video (720×1280, H.264, menos de 25 MB cada uno: es el tope por archivo de Cloudflare).
 */
import type { ImageMetadata } from 'astro';
import joyce from '../assets/eventos/recap-joyce-rivas.jpg';
import anguley from '../assets/eventos/recap-anguley-isaza.jpg';

export type Recap = { titulo: string; nota: string; mp4: string; poster: ImageMetadata };

export const RECAPS: Recap[] = [
  { titulo: 'Recap de la clase de Joyce Rivas en el Museo Nacional', nota: 'Clase al aire libre en medio de los plantones por la censura de piezas del museo.', mp4: '/video/recap-joyce-rivas.mp4', poster: joyce },
  { titulo: 'Recap de la clase de Anguley Isaza en el Museo Nacional', nota: 'Clase sobre identidad nacional y el museo, a las puertas del Museo Nacional.', mp4: '/video/recap-anguley-isaza.mp4', poster: anguley },
];
export const RECAPS_PIE = 'Cubrimiento de un evento social, 2026. Video vertical para redes, en foto y video de Dial.';
