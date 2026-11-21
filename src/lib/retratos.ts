/**
 * Retratos y fotografía (21 nov 2026): fotos PROPIAS de Martín, sesión «Secuencia en humedal»
 * (original en D:/Fotos Personales/Nostalgia/Nati/Secuencia en Humedal 1, 24 fotos; aquí las elegidas,
 * a 2560 px y sin metadatos). No se revelan con la película: van como él las editó.
 * La 20 es la cabecera del servicio; la galería va en este orden (primera a todo el ancho, luego de a pares).
 */
import type { ImageMetadata } from 'astro';
import h01 from '../assets/retratos/humedal-01.jpg';
import h02 from '../assets/retratos/humedal-02.jpg';
import h07 from '../assets/retratos/humedal-07.jpg';
import h09 from '../assets/retratos/humedal-09.jpg';
import h12 from '../assets/retratos/humedal-12.jpg';
import h16 from '../assets/retratos/humedal-16.jpg';
import h20 from '../assets/retratos/humedal-20.jpg';
import h24 from '../assets/retratos/humedal-24.jpg';

export const FOTOGRAFO = 'Martín Perea Tobón';

export const PORTADA_RETRATOS = {
  src: h20,
  alt: 'Una mujer sentada en un tronco mira a lo lejos, entre árboles y la baranda verde de un puente',
  autor: FOTOGRAFO,
  foco: '35% 30%',
  propia: true,
};

export const GALERIA_RETRATOS: { src: ImageMetadata; alt: string }[] = [
  { src: h07, alt: 'Retrato de cerca: una hoja seca le cruza la cara y el marco amarillo de un juego queda desenfocado delante' },
  { src: h02, alt: 'Una mujer mira hacia abajo, enmarcada por los aros amarillos de un juego infantil oxidado' },
  { src: h09, alt: 'Retrato de una mujer que mira a cámara, agachada en el pasto junto a un juego amarillo' },
  { src: h12, alt: 'Una mujer sonríe mirando a cámara detrás de las barras amarillas de un juego' },
  { src: h01, alt: 'Túnel de aros amarillos; al fondo, una mujer asoma los ojos sobre un asiento' },
  { src: h16, alt: 'Plano abierto: una mujer sentada en un tronco junto a un puente de madera, en medio del bosque' },
  { src: h24, alt: 'Una mujer sentada en un tronco mira a la luz, con barras verdes desenfocadas delante' },
];
