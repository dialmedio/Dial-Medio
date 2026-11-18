/**
 * Carruseles de Dial que sirven de muestra del servicio de campañas y diseño (18 nov 2026). Los eligió Martín:
 * Quintín Lame, el Museo Nacional con sus fotos, Difuntos, etc.; fuera Brasil y la del Centro Cultural. Del Museo
 * se muestra desde la lámina 2 porque la portada lleva un cartel con insultos al presidente.
 * Archivos en src/assets/muestras: <id>.jpg (primera lámina) y <id>-2.jpg, -3, -4 (siguientes).
 */
import type { ImageMetadata } from 'astro';

const archivos = import.meta.glob<{ default: ImageMetadata }>('../assets/muestras/*.jpg', { eager: true });

export type Carrusel = { id: string; titulo: string; tema: string; laminas: ImageMetadata[] };

const DATOS: Omit<Carrusel, 'laminas'>[] = [
  { id: 'quintin-lame', titulo: 'Primero Pizarro, luego el museo; ahora Quintín Lame', tema: 'Memoria' },
  { id: 'museo-nacional', titulo: 'Con danza y carteles defendieron las obras del Museo Nacional', tema: 'Cobertura · fotos de Martín Perea' },
  { id: 'difuntos', titulo: '¿Dónde se le llevan flores a un desaparecido?', tema: 'Memoria' },
  { id: 'tina-modotti', titulo: 'Tina Modotti: una cámara del lado de los obreros', tema: 'Arte y memoria' },
  { id: 'algoritmo', titulo: '¿Cómo se le gana al algoritmo?', tema: 'Ensayo' },
  { id: 'cero-focos', titulo: 'Por primera vez, ningún foco de tala en Colombia', tema: 'Ambiente' },
  { id: 'cien-dias', titulo: '100 días, 100 en veremos', tema: 'Datos · con la RED Quynza' },
  { id: 'bosque-guaviare', titulo: 'Pagarles por cuidar el bosque sí funciona', tema: 'Ambiente · datos' },
];

const lamina = (nombre: string) => archivos[`../assets/muestras/${nombre}.jpg`]?.default;

export const CARRUSELES: Carrusel[] = DATOS.map((d) => ({
  ...d,
  laminas: [d.id, `${d.id}-2`, `${d.id}-3`, `${d.id}-4`].map(lamina).filter((x): x is ImageMetadata => !!x),
}));

export const carrusel = (id: string) => CARRUSELES.find((c) => c.id === id)!;
