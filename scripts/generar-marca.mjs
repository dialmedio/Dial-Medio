// Genera los archivos de marca de Dial (manual v3) a partir de las fuentes reales.
//   - src/data/logotipo.json  → trazos del logotipo que usa el sitio
//   - public/marca/*.svg      → logotipo, símbolo y firmas descargables
// Uso: node scripts/generar-marca.mjs
import * as fk from 'fontkit';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

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

// ---------- Símbolo: una voz, diez alrededor ----------
// Mismas proporciones que src/components/Simbolo.astro (viewBox 0 0 200 200).
export const simbolo = (color, { radios = true, centro = COLOR.terracota } = {}) => {
  const R = 72, rNodo = 10.5, rCentro = 18, hueco = 30, trazo = 4.2;
  const ang = [...Array(10)].map((_, i) => ((-90 + i * 36) * Math.PI) / 180);
  const p = (a, d) => [100 + d * Math.cos(a), 100 + d * Math.sin(a)].map((v) => +v.toFixed(2));
  let o = '';
  if (radios)
    o += `<g stroke="${color}" stroke-width="${trazo}" stroke-linecap="round">${ang
      .map((a) => { const [x1, y1] = p(a, hueco); const [x2, y2] = p(a, R - rNodo - 7); return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`; })
      .join('')}</g>`;
  o += `<g fill="${color}">${ang.map((a) => { const [cx, cy] = p(a, R); return `<circle cx="${cx}" cy="${cy}" r="${rNodo}"/>`; }).join('')}</g>`;
  o += `<circle cx="100" cy="100" r="${rCentro}" fill="${centro}"/>`;
  return o;
};

// ---------- Palabras en serif cursiva (líneas de negocio) ----------
const palabra = (texto, tam) => {
  const e = tam / serif.unitsPerEm;
  const r = serif.layout(texto);
  let xx = 0, d = '';
  r.glyphs.forEach((g, n) => { d += g.path.scale(e, -e).translate(xx, 0).toSVG(); xx += r.positions[n].xAdvance * e; });
  return { d, ancho: xx };
};

// ---------- Archivos SVG ----------
mkdirSync('public/marca', { recursive: true });
const guardar = (nombre, w, h, cuerpo, fondo) =>
  writeFileSync(`public/marca/${nombre}.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w.toFixed(1)} ${h.toFixed(1)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}">${fondo ? `<rect width="100%" height="100%" fill="${fondo}"/>` : ''}${cuerpo}</svg>`);

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
guardar('dial-simbolo-compacto', 200, 200, simbolo(COLOR.carbon, { radios: false }));
guardar('dial-avatar', 400, 400, `<g transform="translate(40 40) scale(1.6)">${simbolo(COLOR.papel)}</g>`, COLOR.carbon);

// Firma horizontal: símbolo + logotipo
const alturaSimbolo = asc * 1.36;
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
console.log('Listo: src/data/logotipo.json y public/marca/*.svg');
