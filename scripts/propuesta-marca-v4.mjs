// Propuesta de marca v4 (24 oct 2026): el símbolo deja de ser el debate ("una voz, diez alrededor")
// y pasa a ser un dial: una perilla con su muesca. El logotipo "dial" no cambia.
// Es una PROPUESTA: escribe fuera del sitio (no toca public/marca ni el manual) hasta que Martín la apruebe.
// Uso: node scripts/propuesta-marca-v4.mjs [carpeta de salida]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import sharp from 'sharp';

const SALIDA = process.argv[2] ?? 'D:/AA Dialmedio/AudiovisualDial/Marca Dial v4 (propuesta)';
const C = { carbon: '#17130F', papel: '#F4EEE5', hueso: '#E8DECF', terracota: '#C0442A', terracotaClara: '#E0694A' };
const logo = JSON.parse(readFileSync('src/data/logotipo.json', 'utf8'));
const rI = logo.punto.r; // radio del punto de la i
const asc = 724; // altura de la l del logotipo (unidades del logotipo)
const grosor = (rI * 2) / 1.28; // grosor del asta

// ---------- La perilla ----------
// Construcción (en múltiplos del radio R):
// - diámetro = altura de la l del logotipo, para que en la firma midan lo mismo;
// - la muesca nace al 36 % del radio y llega al 72 %, con un grueso de 0,74 del asta de la l y puntas redondas;
// - girada 45°: el dial ya está sintonizado (ni apagado ni al tope).
export const PERILLA = { R: asc / 2, angulo: 45, desde: 0.36, hasta: 0.72, grueso: grosor * 0.74 };

// Cada línea es una estación del mismo dial: su color y su posición. La marca madre queda a las 45°.
export const ESTACIONES = [
  { linea: 'Dial', angulo: 45, cuerpo: C.carbon, muesca: C.terracota },
  { linea: 'Al Aire', angulo: 0, cuerpo: C.carbon, muesca: '#E58A3A' },
  { linea: 'Termómetro', angulo: 90, cuerpo: '#56705E', muesca: '#E58A3A' },
  { linea: 'Nuevos mundos posibles', angulo: 135, cuerpo: '#14335C', muesca: '#E7B043' },
  { linea: 'Arte y memoria', angulo: -135, cuerpo: '#1A1512', muesca: '#E8B48A' },
  { linea: 'Tecnología y poder', angulo: -45, cuerpo: '#0A0A0A', muesca: '#C8F546' },
];

export function perilla(cx, cy, { R = PERILLA.R, cuerpo = C.carbon, muesca = C.terracota, angulo = PERILLA.angulo } = {}) {
  const s = R / PERILLA.R;
  const a = ((angulo - 90) * Math.PI) / 180;
  const p = (f) => [cx + f * R * Math.cos(a), cy + f * R * Math.sin(a)].map((v) => +v.toFixed(2));
  const [x1, y1] = p(PERILLA.desde), [x2, y2] = p(PERILLA.hasta);
  return `<circle cx="${cx}" cy="${cy}" r="${+R.toFixed(2)}" fill="${cuerpo}"/>`
    + `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${muesca}" stroke-width="${+(PERILLA.grueso * s).toFixed(2)}" stroke-linecap="round"/>`;
}

export const letras = (ox, oy, s, tinta, punto = C.terracota) =>
  `<g transform="translate(${ox} ${oy}) scale(${s})"><path d="${logo.d}" fill="${tinta}"/><circle cx="${logo.punto.cx}" cy="${logo.punto.cy}" r="${logo.punto.r}" fill="${punto}"/></g>`;

const svg = (w, h, cuerpo, fondo) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${+w.toFixed(1)} ${+h.toFixed(1)}" width="${Math.round(w)}" height="${Math.round(h)}">${fondo ? `<rect width="100%" height="100%" fill="${fondo}"/>` : ''}${cuerpo}</svg>`;

async function guardar(nombre, w, h, cuerpo, fondo, ancho = 2000) {
  const s = svg(w, h, cuerpo, fondo);
  writeFileSync(`${SALIDA}/${nombre}.svg`, s);
  await sharp(Buffer.from(s), { density: 72 * (ancho / w) }).png().toFile(`${SALIDA}/${nombre}.png`);
}

// Firma horizontal: perilla a la altura de la l, separada por un punto de la i y medio de aire.
export function firma(tinta, { cuerpo = tinta, muesca = C.terracota, punto = C.terracota, pad = 120 } = {}) {
  const R = PERILLA.R, sep = rI * 3;
  const w = pad * 2 + R * 2 + sep + logo.ancho, h = pad * 2 + asc;
  const cy = pad + R;
  return [w, h, perilla(pad + R, cy, { cuerpo, muesca }) + letras(pad + R * 2 + sep, pad + asc, 1, tinta, punto)];
}

// Firma apilada: perilla arriba, letras abajo, centradas.
function apilada(tinta, cuerpo = tinta) {
  const pad = 120, R = PERILLA.R * 1.1, sep = rI * 2.4;
  const w = pad * 2 + logo.ancho, h = pad * 2 + R * 2 + sep + asc;
  return [w, h, perilla(w / 2, pad + R, { R, cuerpo }) + letras(pad, pad + R * 2 + sep + asc, 1, tinta)];
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/propuesta-marca-v4.mjs')) {
  mkdirSync(SALIDA, { recursive: true });
  const T = 1000, m = T / 2;
  await guardar('dial-v4-simbolo-oscuro', T, T, perilla(m, m, { R: 400 }));
  await guardar('dial-v4-simbolo-claro', T, T, perilla(m, m, { R: 400, cuerpo: C.papel }));
  for (const [n, t] of [['oscuro', C.carbon], ['claro', C.papel]]) {
    const [w, h, c] = firma(t);
    await guardar(`dial-v4-firma-${n}`, w, h, c, null, 3000);
    const [w2, h2, c2] = apilada(t);
    await guardar(`dial-v4-apilada-${n}`, w2, h2, c2, null, 2000);
  }
  // Fotos de perfil (cuadradas, la perilla a radio 0,3 del lado: cabe holgada en el recorte circular)
  await guardar('dial-v4-perfil-carbon', T, T, perilla(m, m, { R: T * 0.3, cuerpo: C.papel }), C.carbon);
  await guardar('dial-v4-perfil-papel', T, T, perilla(m, m, { R: T * 0.3 }), C.papel);
  await guardar('dial-v4-perfil-terracota', T, T, perilla(m, m, { R: T * 0.3, cuerpo: C.papel, muesca: C.carbon }), C.terracota);
  await guardar('dial-v4-favicon', 64, 64, perilla(32, 32, { R: 31 }), null, 256);
  for (const e of ESTACIONES.slice(1)) {
    const slug = e.linea.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, '-');
    await guardar(`dial-v4-linea-${slug}`, T, T, perilla(m, m, { R: 400, cuerpo: e.cuerpo, muesca: e.muesca, angulo: e.angulo }));
  }
  console.log('Listo en', SALIDA);
}
