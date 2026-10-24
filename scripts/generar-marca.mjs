// Genera los archivos de marca de Dial (manual v3) a partir de las fuentes reales.
//   - src/data/logotipo.json  → trazos del logotipo que usa el sitio
//   - public/marca/*.svg|png  → logotipo, símbolo, firmas y líneas de negocio descargables
// Uso: node scripts/generar-marca.mjs
import * as fk from 'fontkit';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, statSync } from 'node:fs';
import sharp from 'sharp';

const fontkit = fk.default ?? fk;
const sans = fontkit.create(readFileSync('scripts/fuentes/InstrumentSans.ttf')).getVariation({ wght: 700, wdth: 92 });
const serif = fontkit.create(readFileSync('scripts/fuentes/InstrumentSerif-Italic.ttf'));

export const COLOR = {
  carbon: '#17130F',
  papel: '#F4EEE5',
  hueso: '#E8DECF',
  terracota: '#C0442A',
};

// ---------- Logotipo: "dial" con el punto de la i como nodo central ----------
const EM = 1000; // unidades de trabajo
const esc = EM / sans.unitsPerEm;
const tracking = -0.012 * EM;
const run = sans.layout('dıal');
let x = 0;
let dLogo = '';
let iCaja = null;
run.glyphs.forEach((g, n) => {
  const p = g.path.scale(esc, -esc).translate(x, 0);
  dLogo += p.toSVG();
  if (n === 1) iCaja = { x0: x + g.bbox.minX * esc, x1: x + g.bbox.maxX * esc };
  x += run.positions[n].xAdvance * esc + tracking;
});
const anchoLogo = x - tracking;
const l = sans.glyphForCodePoint('l'.codePointAt(0));
const asc = l.bbox.maxY * esc; // altura de ascendente
const grosor = (l.bbox.maxX - l.bbox.minX) * esc; // grosor del asta
const r = (grosor * 1.28) / 2;
const punto = { cx: (iCaja.x0 + iCaja.x1) / 2, cy: -(asc - r), r };
const logo = {
  viewBox: [0, -asc - 4, anchoLogo, asc + 4 + 12].map((v) => +v.toFixed(1)).join(' '),
  ancho: +anchoLogo.toFixed(1),
  alto: +(asc + 16).toFixed(1),
  d: dLogo,
  punto: { cx: +punto.cx.toFixed(1), cy: +punto.cy.toFixed(1), r: +punto.r.toFixed(1) },
};
writeFileSync('src/data/logotipo.json', JSON.stringify(logo));

// ---------- Símbolo: el aro con punto (marca v4, 24 oct 2026) ----------
// Geometría en src/lib/aro.mjs (la misma de src/components/Simbolo.astro), en una caja de 200 × 200.
import { aro } from '../src/lib/aro.mjs';
let nAro = 0;
export const simbolo = (color, { compacto = false, centro = COLOR.terracota } = {}) => aro(color, { compacto, centro, id: `aro${nAro++}` });

// ---------- Palabras en serif cursiva (líneas de negocio) ----------
const palabra = (texto, tam) => {
  const e = tam / serif.unitsPerEm;
  const r = serif.layout(texto);
  let xx = 0, d = '';
  const caja = { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity }; // tinta real, en coordenadas SVG
  r.glyphs.forEach((g, n) => {
    const p = g.path.scale(e, -e).translate(xx, 0);
    d += p.toSVG();
    const b = p.bbox;
    if (Number.isFinite(b.minX)) {
      caja.x0 = Math.min(caja.x0, b.minX); caja.x1 = Math.max(caja.x1, b.maxX);
      caja.y0 = Math.min(caja.y0, b.minY); caja.y1 = Math.max(caja.y1, b.maxY);
    }
    xx += r.positions[n].xAdvance * e;
  });
  return { d, ancho: xx, caja };
};

// ---------- Archivos SVG ----------
mkdirSync('public/marca', { recursive: true });
// Solo reescribe si cambió, para que el PNG se regenere únicamente cuando su SVG es más nuevo
const guardar = (nombre, w, h, cuerpo, fondo) => {
  const ruta = `public/marca/${nombre}.svg`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w.toFixed(1)} ${h.toFixed(1)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}">${fondo ? `<rect width="100%" height="100%" fill="${fondo}"/>` : ''}${cuerpo}</svg>`;
  if (!existsSync(ruta) || readFileSync(ruta, 'utf8') !== svg) writeFileSync(ruta, svg);
};

const pad = 60;
const logoSVG = (color, ox, oy, s = 1) =>
  `<g transform="translate(${ox} ${oy}) scale(${s})"><path d="${logo.d}" fill="${color}"/><circle cx="${logo.punto.cx}" cy="${logo.punto.cy}" r="${logo.punto.r}" fill="${COLOR.terracota}"/></g>`;

// Logotipo solo
for (const [n, c] of [['oscuro', COLOR.carbon], ['claro', COLOR.papel]])
  guardar(`dial-logotipo-${n}`, logo.ancho + pad * 2, logo.alto + pad * 2, logoSVG(c, pad, pad + asc + 4));
// Logotipo sobre terracota: todo en papel
guardar('dial-logotipo-sobre-terracota', logo.ancho + pad * 2, logo.alto + pad * 2,
  `<g transform="translate(${pad} ${pad + asc + 4})"><path d="${logo.d}" fill="${COLOR.papel}"/><circle cx="${logo.punto.cx}" cy="${logo.punto.cy}" r="${logo.punto.r}" fill="${COLOR.papel}"/></g>`, COLOR.terracota);

// Símbolo
for (const [n, c] of [['oscuro', COLOR.carbon], ['claro', COLOR.papel]]) guardar(`dial-simbolo-${n}`, 200, 200, simbolo(c));
guardar('dial-simbolo-compacto', 200, 200, simbolo(COLOR.carbon, { compacto: true }));
guardar('dial-avatar', 400, 400, `<g transform="translate(40 40) scale(1.6)">${simbolo(COLOR.papel)}</g>`, COLOR.carbon);

// Firma horizontal: símbolo + logotipo. El aro mide 168 de 200: así su diámetro es 1,05 veces la altura de la l
// (un círculo se ve más chico que una letra recta de la misma altura).
const alturaSimbolo = asc * 1.25;
const sEsc = alturaSimbolo / 200;
const firma = (color, conPalabra) => {
  const gap = asc * 0.3;
  let w = alturaSimbolo + gap + logo.ancho;
  let cuerpo = `<g transform="translate(${pad} ${pad}) scale(${sEsc})">${simbolo(color)}</g>`;
  const base = pad + alturaSimbolo / 2 + asc / 2;
  cuerpo += logoSVG(color, pad + alturaSimbolo + gap, base);
  if (conPalabra) {
    const pw = palabra(conPalabra, asc * 1.02);
    cuerpo += `<path transform="translate(${pad + alturaSimbolo + gap + logo.ancho + asc * 0.2} ${base})" d="${pw.d}" fill="${COLOR.terracota}"/>`;
    w += asc * 0.2 + pw.ancho;
  }
  return { w: w + pad * 2, h: alturaSimbolo + pad * 2, cuerpo };
};
for (const [n, c] of [['oscuro', COLOR.carbon], ['claro', COLOR.papel]]) {
  let f = firma(c);
  guardar(`dial-firma-${n}`, f.w, f.h, f.cuerpo);
  for (const linea of ['impacto', 'encuentros', 'medio']) {
    f = firma(c, linea);
    guardar(`dial-${linea}-${n}`, f.w, f.h, f.cuerpo);
  }
}

// Líneas de negocio solo con letras (sin símbolo)
//   dial-<linea>-letras-*   → horizontal, igual que la firma pero sin la esfera
//   dial-<linea>-centrado-* → "dial" arriba y la línea en serif debajo, centradas
const letras = (color, linea) => {
  const pw = palabra(linea, asc * 1.02);
  const gap = asc * 0.2;
  const w = logo.ancho + gap + pw.ancho;
  const base = pad + asc + 4;
  const cuerpo = logoSVG(color, pad, base) +
    `<path transform="translate(${pad + logo.ancho + gap} ${base})" d="${pw.d}" fill="${COLOR.terracota}"/>`;
  return { w: w + pad * 2, h: logo.alto + pad * 2, cuerpo };
};
const centrado = (color, linea, acento = COLOR.terracota) => {
  const pw = palabra(linea, asc * 0.88);
  const altaSerif = asc * 0.88 * 0.75; // altura de ascendente de la serif: igual para las tres líneas
  const gap = asc * 0.2;
  const ancho = Math.max(logo.ancho, pw.caja.x1 - pw.caja.x0);
  const baseDial = pad + asc + 4;
  const baseLinea = baseDial + gap + altaSerif;
  const bajo = Math.max(baseLinea + pw.caja.y1, baseDial + 12);
  const cx = pad + ancho / 2;
  const cuerpo = logoSVG(color, cx - logo.ancho / 2, baseDial) +
    `<path transform="translate(${(cx - (pw.caja.x0 + pw.caja.x1) / 2).toFixed(1)} ${baseLinea.toFixed(1)})" d="${pw.d}" fill="${acento}"/>`;
  return { w: ancho + pad * 2, h: bajo + pad, cuerpo };
};
for (const [n, c] of [['oscuro', COLOR.carbon], ['claro', COLOR.papel]])
  for (const linea of ['impacto', 'encuentros', 'medio']) {
    let f = letras(c, linea);
    guardar(`dial-${linea}-letras-${n}`, f.w, f.h, f.cuerpo);
    f = centrado(c, linea);
    guardar(`dial-${linea}-centrado-${n}`, f.w, f.h, f.cuerpo);
  }

// Fotos de perfil para redes: cuadradas (así se suben) y pensadas para el recorte circular.
// La tinta se mide en píxeles y se escala para que su punto más lejano quede a RADIO del lado
// desde el centro: un anillo de aire dentro del círculo, también bajo los aros de historias.
const RADIO = 0.36;
const medirTinta = async (w, h, cuerpo) => {
  const px = 1200 / Math.max(w, h);
  const { data, info } = await sharp(Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${Math.round(w * px)}" height="${Math.round(h * px)}">${cuerpo}</svg>`))
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const tinta = (x, y) => data[(y * info.width + x) * 4 + 3] > 8;
  let x0 = Infinity, x1 = -1, y0 = Infinity, y1 = -1;
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++)
    if (tinta(x, y)) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const cx = (x0 + x1 + 1) / 2, cy = (y0 + y1 + 1) / 2;
  let r = 0;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++)
    if (tinta(x, y)) r = Math.max(r, Math.hypot(x + 0.5 - cx, y + 0.5 - cy));
  return { cx: cx / px, cy: cy / px, r: (r + 1) / px, ancho: (x1 - x0 + 1) / px, alto: (y1 - y0 + 1) / px };
};
const perfil = async (nombre, fondo, { w, h, cuerpo }) => {
  const L = 1000;
  const t = await medirTinta(w, h, cuerpo);
  const k = (RADIO * L) / t.r;
  guardar(nombre, L, L,
    `<g transform="translate(${(L / 2 - k * t.cx).toFixed(2)} ${(L / 2 - k * t.cy).toFixed(2)}) scale(${k.toFixed(5)})">${cuerpo}</g>`, fondo);
};
// Sobre carbón la terracota se apaga en tamaño pequeño: el acento en serif va un punto más clara
const TERRACOTA_CLARA = '#E0694A';
for (const [n, fondo, c, acento] of [['carbon', COLOR.carbon, COLOR.papel, TERRACOTA_CLARA], ['papel', COLOR.papel, COLOR.carbon, COLOR.terracota]]) {
  await perfil(`dial-perfil-simbolo-${n}`, fondo, { w: 200, h: 200, cuerpo: simbolo(c) });
  await perfil(`dial-perfil-dial-${n}`, fondo, { w: logo.ancho + pad * 2, h: logo.alto + pad * 2, cuerpo: logoSVG(c, pad, pad + asc + 4) });
  for (const linea of ['impacto', 'encuentros', 'medio'])
    await perfil(`dial-perfil-${linea}-${n}`, fondo, centrado(c, linea, acento));
}

// Banner de YouTube para Dial Medio, fondo papel: 2560×1440. YouTube recorta según el aparato;
// lo único visible en todos es la franja central de 1546×423, y ahí va todo.
{
  const L = 2560, A = 1440, seguroAncho = 1546;
  const f = firma(COLOR.carbon, 'medio');
  const t = await medirTinta(f.w, f.h, f.cuerpo);
  const marca = (ancho, cy) => {
    const k = ancho / t.ancho;
    return `<g transform="translate(${(L / 2 - k * t.cx).toFixed(2)} ${(cy - k * t.cy).toFixed(2)}) scale(${k.toFixed(5)})">${f.cuerpo}</g>`;
  };
  // Sin lema: la firma ocupa ~80 % del ancho seguro
  guardar('dial-medio-banner-youtube', L, A, marca(seguroAncho * 0.8, A / 2), COLOR.papel);
  // Con lema: firma un poco menor y "Sintonizar es conversar." debajo, centrados como bloque
  const anchoFirma = seguroAncho * 0.72, altoFirma = (anchoFirma / t.ancho) * t.alto;
  const lema = palabra('Sintonizar es conversar.', 74);
  const gap = 46, altoLema = 74 * 0.75;
  const arriba = A / 2 - (altoFirma + gap + altoLema) / 2;
  guardar('dial-medio-banner-youtube-lema', L, A,
    marca(anchoFirma, arriba + altoFirma / 2) +
    `<path transform="translate(${(L / 2 - (lema.caja.x0 + lema.caja.x1) / 2).toFixed(1)} ${(arriba + altoFirma + gap + altoLema).toFixed(1)})" d="${lema.d}" fill="${COLOR.carbon}"/>`,
    COLOR.papel);
}

// PNG en alta resolución: 3000 px de ancho (2000 los cuadrados; los banners a su tamaño exacto)
const anchoExacto = { 'dial-medio-banner-youtube': 2560, 'dial-medio-banner-youtube-lema': 2560 };
for (const archivo of readdirSync('public/marca').filter((a) => a.endsWith('.svg'))) {
  const png = `public/marca/${archivo.replace(/\.svg$/, '.png')}`;
  if (existsSync(png) && statSync(png).mtimeMs >= statSync(`public/marca/${archivo}`).mtimeMs) continue;
  const svg = readFileSync(`public/marca/${archivo}`);
  const [, , w, h] = svg.toString().match(/viewBox="([^"]+)"/)[1].split(' ').map(Number);
  const destino = anchoExacto[archivo.replace(/\.svg$/, '')] ?? (Math.abs(w - h) < 1 ? 2000 : 3000);
  await sharp(svg, { density: Math.max(72, (72 * destino) / w) })
    .resize({ width: destino })
    .png({ compressionLevel: 9 })
    .toFile(png);
}
console.log('Listo: src/data/logotipo.json y public/marca/*.svg + *.png');
