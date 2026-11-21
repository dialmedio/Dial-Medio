/**
 * Servicios (21 nov 2026): cada uno tiene su página en /servicios/<slug> para que Google la muestre
 * cuando alguien busca ese servicio. /servicios sigue siendo el resumen de los seis.
 */
import type { CollectionEntry } from 'astro:content';

export const rutaServicio = (s: CollectionEntry<'servicios'>) => `/servicios/${s.data.ruta}`;

// Trabajo nuestro junto a cada servicio (19 nov 2026): las productoras grandes muestran obra, no listas.
// Publicidad aún no tiene comerciales propios: se muestra la imagen de los videoclips, sin decir que son anuncios.
export type Obra = { titulo: string; id: string };
const MONGOLIA = { titulo: 'Los últimos nómadas de Mongolia', id: 'ONV3lsPwmPo' };
const JAZZ = { titulo: 'Historia del jazz colombiano en 10 minutos', id: '9-pppveOQRs' };
const INVITRO = { titulo: 'In-Vitro, sesión en vivo', id: 'L84B5ZGakjY' };
const FEO = { titulo: 'Delayn Núñez — Feo Palante', id: '1PCgmrlsKUQ' };
const MANGORITO = { titulo: 'Arrabal Gentío — Mangorito', id: '5lgpy6H5sTU' };
export const OBRAS: Record<string, { rotulo: string; obras: Obra[] }> = {
  documental: { rotulo: 'Hecho por nosotros', obras: [MONGOLIA, JAZZ] },
  publicidad: { rotulo: 'Nuestra imagen', obras: [INVITRO, FEO, MANGORITO] },
  musica: { rotulo: 'Hecho por nosotros', obras: [INVITRO, FEO, MANGORITO] },
  eventos: { rotulo: 'Hecho por nosotros', obras: [{ titulo: 'Un progresista de mano dura frente a siete conservadores', id: 'lWeFYIvic5Q' }, { titulo: '2 economistas conservadores frente a 10 progresistas', id: 'szMuJkTqr4c' }] },
  divulgacion: { rotulo: 'Hecho por nosotros', obras: [JAZZ, { titulo: 'Lo que la gente quiere es vivir, episodio 1', id: '1z-0Il0n8xE' }] },
};
