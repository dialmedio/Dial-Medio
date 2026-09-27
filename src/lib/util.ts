import sitio from '../data/sitio.json';

export type Video = {
  plataforma: 'youtube' | 'vimeo';
  id: string;
  miniatura?: string;
  vertical?: boolean;
};

export const lineas = {
  impacto: { nombre: 'Dial Impacto', ruta: '/impacto' },
  encuentros: { nombre: 'Dial Encuentros', ruta: '/encuentros' },
  celebraciones: { nombre: 'Celebraciones', ruta: '/encuentros/celebraciones' },
  medio: { nombre: 'Dial Medio', ruta: '/medio' },
} as const;

/** Ruta de un caso según su vitrina. */
export const rutaCaso = (vitrina: 'impacto' | 'encuentros' | 'celebraciones', id: string) =>
  vitrina === 'impacto'
    ? `/impacto/casos/${id}`
    : vitrina === 'encuentros'
      ? `/encuentros/casos/${id}`
      : `/encuentros/celebraciones/${id}`;

export const miniatura = (v: Video) => {
  if (v.miniatura) return v.miniatura;
  if (v.plataforma === 'youtube') {
    return v.vertical ? `https://i.ytimg.com/vi/${v.id}/oar2.jpg` : `https://i.ytimg.com/vi/${v.id}/maxresdefault.jpg`;
  }
  return '';
};

export const urlVideo = (v: Video) =>
  v.plataforma === 'vimeo'
    ? `https://vimeo.com/${v.id}`
    : v.vertical
      ? `https://www.youtube.com/shorts/${v.id}`
      : `https://www.youtube.com/watch?v=${v.id}`;

export const whatsapp = (mensaje: string = sitio.whatsapp.mensaje) =>
  `https://wa.me/${sitio.whatsapp.numero}?text=${encodeURIComponent(mensaje)}`;

export const anio = (d: Date) => d.getUTCFullYear();

const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
export const fechaCorta = (d: Date) => `${meses[d.getUTCMonth()]} ${d.getUTCFullYear()}`;

export const formatos = {
  debate: 'Debate',
  videopodcast: 'Videopodcast',
  documental: 'Documental',
  clip: 'Clip',
} as const;

export const estados = {
  publicado: '',
  'en-preparacion': 'En preparación',
  'en-posproduccion': 'En posproducción',
} as const;

/** Número con dos dígitos para numeraciones editoriales: 01, 02… */
export const dos = (n: number) => String(n).padStart(2, '0');
