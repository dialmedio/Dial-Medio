/**
 * Música de fondo del sitio (21 nov 2026). Martín eligió música de Fototoma (antes se probaron piezas libres de
 * Lee Rosevere y la Gymnopédie de Satie): el boceto del documental de Pereira, D:/Fototoma/Pereira/Boceto.wav,
 * que empieza y termina en silencio y por eso vuelve a empezar sin corte.
 * Para cambiarla: mp3 en public/audio/ (160 kbps desde el WAV) y otra entrada aquí.
 */
export type Pista = { archivo: string; titulo: string; autor: string; enlace: string };

export const ELEGIDA: Pista = {
  archivo: '/audio/fototoma-boceto-pereira.mp3',
  titulo: 'Boceto para Pereira',
  autor: 'Fototoma',
  enlace: 'https://fototomaproducciones.com',
};
