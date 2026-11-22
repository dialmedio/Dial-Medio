/**
 * Serie «¿Qué es la paz?» (nov 2026): preguntas en la calle, publicadas como reels en Instagram.
 * En el sitio va recortada a la franja de imagen (el reel es vertical con bandas negras):
 * public/video/paz-<persona>.mp4, 1280 px, H.264 a 1,55 Mbps (menos de 25 MB, tope de Cloudflare).
 */
import type { ImageMetadata } from 'astro';
import jordan from '../assets/paz/jordan-portada.jpg';

export type VideoPropio = { titulo: string; mp4: string; poster: ImageMetadata; instagram?: string };

export const PAZ_JORDAN: VideoPropio = {
  titulo: '¿Qué es la paz? Le preguntamos en la calle',
  mp4: '/video/paz-jordan.mp4',
  poster: jordan,
  instagram: 'https://www.instagram.com/reel/DgDiglzzm1r/',
};
