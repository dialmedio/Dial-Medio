/**
 * Imagen propia (19 nov 2026): fotogramas de trabajos en los que Dial y Fototoma participaron y fotos de Martín.
 * Martín pidió dejar de usar fotos de stock donde hay trabajo nuestro, con el tono documental de VIST
 * (personas reales, cercanas, a sangre). Fotogramas = miniaturas de YouTube en src/assets/obra.
 */
import type { ImageMetadata } from 'astro';
import mongolia from '../assets/obra/mongolia.jpg';
import inVitroVivo from '../assets/obra/in-vitro-vivo.jpg';
import mangorito from '../assets/obra/mangorito.jpg';
import feoPalante from '../assets/obra/feo-palante.jpg';
import palenque from '../assets/estudio/palenque.jpg';

export type Fotograma = { src: ImageMetadata; alt: string; titulo: string; nota: string; href: string; foco?: string };

export const OBRA = {
  mongolia: { src: mongolia, alt: 'Una mujer nómada camina con renos blancos por la estepa de Mongolia', titulo: 'Los últimos nómadas de Mongolia', nota: 'Música y diseño sonoro', href: '/trabajo#destacada', foco: '35% 50%' },
  inVitroVivo: { src: inVitroVivo, alt: 'Bajista y baterista tocan bajo luz roja en la sesión en vivo de In-Vitro', titulo: 'In-Vitro, sesión en vivo', nota: 'Imagen y sonido', href: '/trabajo#musica', foco: '60% 40%' },
  feoPalante: { src: feoPalante, alt: 'Retrato en blanco y negro de Delayn Núñez con gafas oscuras', titulo: 'Delayn Núñez — Feo Palante', nota: 'Videoclip', href: '/trabajo#musica', foco: '62% 40%' },
  mangorito: { src: mangorito, alt: 'Una persona se inclina a beber de un arroyo entre las rocas', titulo: 'Arrabal Gentío — Mangorito', nota: 'Videoclip', href: '/trabajo#musica', foco: '35% 50%' },
  palenque: { src: palenque, alt: 'Un niño camina frente a una casa con ropa tendida en San Basilio de Palenque', titulo: 'Palenque', nota: 'Foto de Martín Perea', href: '/nosotros', foco: '40% 60%' },
} satisfies Record<string, Fotograma>;
