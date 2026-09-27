// Genera las imágenes para compartir en redes (public/og/*.png y public/og.png) y los íconos PNG.
// Uso: node scripts/generar-imagenes.mjs
// Requiere Anton, Oswald y Space Mono instaladas en el sistema (están en Google Fonts).
import sharp from 'sharp';
import { existsSync, mkdirSync } from 'node:fs';

const CARBON = '#1a1613', TERRACOTA = '#c1502e', HUESO = '#e8dfd0', HUESO2 = '#b8ae9f', AMBAR = '#d97a34';
const W = 1200, H = 630, M = 72;

const dirs = [process.env.LOCALAPPDATA + '/Microsoft/Windows/Fonts', 'C:/Windows/Fonts'];
const fuente = (...nombres) => {
  for (const n of nombres) for (const d of dirs) if (existsSync(`${d}/${n}`)) return `${d}/${n}`;
  throw new Error(`Falta la fuente ${nombres[0]}`);
};
const ANTON = fuente('Anton-Regular.ttf');
const OSWALD = fuente('Oswald-VariableFont_wght.ttf', 'Oswald-Regular.ttf');
const MONO = fuente('SpaceMono-Regular.ttf');

// Cada página con su propia tarjeta. Cada línea del título admite <span foreground="...">.
const paginas = {
  inicio: {
    kicker: 'Productora audiovisual · Bogotá',
    lineas: [`CONTAMOS,`, `<span foreground="${TERRACOTA}">Y MEDIMOS,</span>`, `EL ENCUENTRO HUMANO.`],
    sub: 'Documental, cobertura, eventos y un medio propio de debates.',
  },
  impacto: {
    kicker: 'Dial Impacto',
    lineas: [`HISTORIAS PARA`, `ORGANIZACIONES QUE`, `<span foreground="${TERRACOTA}">TRANSFORMAN.</span>`],
    sub: 'Documental · Cobertura · Pieza + medición · Marca con propósito',
  },
  medicion: {
    kicker: 'Dial Impacto · Pieza + medición',
    lineas: [`MEDIMOS LO QUE`, `UNA HISTORIA`, `<span foreground="${TERRACOTA}">MUEVE.</span>`],
    sub: 'Evaluación antes y después de ver la pieza, lista para reportar.',
  },
  encuentros: {
    kicker: 'Dial Encuentros',
    lineas: [`PRODUCIMOS EL ENCUENTRO.`, `Y LO DEJAMOS`, `<span foreground="${TERRACOTA}">CONTADO.</span>`],
    sub: 'Foros · Festivales · Lanzamientos · Música en vivo',
  },
  celebraciones: {
    kicker: 'Dial Encuentros · Celebraciones',
    lineas: [`LO QUE SE CELEBRA`, `UNA VEZ, SE QUEDA`, `<span foreground="${TERRACOTA}">CONTADO.</span>`],
    sub: 'Bodas · Aniversarios · Serenatas',
  },
  medio: {
    kicker: 'Obra propia · Sintonizar es conversar',
    lineas: [`DIAL`, `<span foreground="${TERRACOTA}">MEDIO</span>`],
    sub: 'Debates entre sectores enfrentados, videopodcast y documentales.',
    grande: true,
  },
  nosotros: {
    kicker: 'Nosotros',
    lineas: [`UN SOLO EQUIPO,`, `DE LA IDEA AL`, `<span foreground="${TERRACOTA}">ESTRENO.</span>`],
    sub: 'Dirección, imagen, sonido y música original, en casa.',
  },
  contacto: {
    kicker: 'Cotizaciones a la medida',
    lineas: [`CUÉNTANOS QUÉ`, `QUIERES`, `<span foreground="${TERRACOTA}">CONTAR.</span>`],
    sub: 'dialmediocol@gmail.com · WhatsApp +57 310 481 3624',
  },
};

const esc = (s) => s.replace(/&/g, '&amp;');

const simbolo = (cx, cy, s, { nodo = 6.2, radio = 1.1, anillo = 2, color = HUESO, opacidad = 1 } = {}) => {
  const k = s / 200, pts = [];
  for (let i = 0; i < 10; i++) {
    const a = ((-90 + i * 36) * Math.PI) / 180;
    pts.push([cx + 64 * k * Math.cos(a), cy + 64 * k * Math.sin(a)]);
  }
  return `<g opacity="${opacidad}">
  <g stroke="${color}" stroke-width="${radio * k}" stroke-linecap="round" opacity=".8">${pts.map(([x, y]) => `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}"/>`).join('')}</g>
  <circle cx="${cx}" cy="${cy}" r="${20 * k}" fill="none" stroke="${color}" stroke-width="${anillo * k}"/>
  <g fill="${color}">${pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${nodo * k}"/>`).join('')}</g>
  <circle cx="${cx}" cy="${cy}" r="${9.4 * k}" fill="${TERRACOTA}" stroke="${color}" stroke-width="${k}"/></g>`;
};

// Regla de frecuencias AM al pie, con la aguja en 810.
const regla = () => {
  const y0 = H - 58, x0 = M, x1 = W - M, f0 = 530, f1 = 1700;
  const px = (f) => x0 + ((f - f0) / (f1 - f0)) * (x1 - x0);
  let t = '';
  for (let f = 540; f <= f1; f += 10) {
    const h = f % 100 === 0 ? 22 : f % 50 === 0 ? 14 : 8;
    const o = f % 100 === 0 ? 0.75 : f % 50 === 0 ? 0.45 : 0.25;
    t += `<line x1="${px(f)}" x2="${px(f)}" y1="${y0 + 22 - h}" y2="${y0 + 22}" stroke="${HUESO}" stroke-opacity="${o}" stroke-width="1.2"/>`;
  }
  const a = px(810);
  t += `<line x1="${a}" x2="${a}" y1="${y0 - 16}" y2="${y0 + 24}" stroke="${TERRACOTA}" stroke-width="3"/><circle cx="${a}" cy="${y0 - 18}" r="6" fill="${TERRACOTA}"/>`;
  return t;
};

const texto = (markup, fontfile, font, width) =>
  sharp({ text: { text: markup, fontfile, font, width, rgba: true, dpi: 72, wrap: 'word' } }).png().toBuffer();

const ruido = await sharp({ create: { width: W, height: H, channels: 3, background: '#808080', noise: { type: 'gaussian', mean: 128, sigma: 38 } } })
  .greyscale()
  .png()
  .toBuffer();

mkdirSync('public/og', { recursive: true });

for (const [slug, p] of Object.entries(paginas)) {
  const base = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <rect width="${W}" height="${H}" fill="${CARBON}"/>
    ${simbolo(1000, 285, 430, { opacidad: 0.95 })}
    <rect x="${M}" y="${M + 58}" width="44" height="3" fill="${TERRACOTA}"/>
    ${regla()}
  </svg>`);

  const marca = await texto(`<span foreground="${HUESO}">DIAL</span>`, ANTON, 'Anton 44', 300);
  const kicker = await texto(`<span foreground="${TERRACOTA}" letter_spacing="2200">${esc(p.kicker.toUpperCase())}</span>`, MONO, 'Space Mono 17', 760);
  const tam = p.grande ? 150 : 64;
  const pasos = await Promise.all(p.lineas.map((l) => texto(`<span foreground="${HUESO}">${l}</span>`, ANTON, `Anton ${tam}`, 1000)));
  const sub = await texto(`<span foreground="${HUESO2}">${esc(p.sub)}</span>`, OSWALD, 'Oswald 25', 760);
  const url = await texto(`<span foreground="${AMBAR}" letter_spacing="1500">DIALMEDIO.ORG · 810 AM</span>`, MONO, 'Space Mono 15', 500);

  const paso = Math.round(tam * 1.12);
  const yTitulo = 158;
  const hT = paso * p.lineas.length;
  await sharp(base)
    .composite([
      { input: ruido, blend: 'overlay', left: 0, top: 0 },
      ...(p.grande ? [] : [{ input: marca, left: M, top: M - 18 }]),
      { input: kicker, left: M + 60, top: M + 48 },
      ...pasos.map((input, i) => ({ input, left: M - 2, top: yTitulo + i * paso })),
      { input: sub, left: M, top: Math.min(yTitulo + hT + 10, H - 140) },
      { input: url, left: W - M - 290, top: H - 122 },
    ])
    .jpeg({ quality: 84, mozjpeg: true, chromaSubsampling: '4:4:4' })
    .toFile(`public/og/${slug}.jpg`);
  console.log('og/' + slug + '.jpg');
}
await sharp('public/og/inicio.jpg').toFile('public/og.jpg');

// --- Íconos ---
const icono = (tam, pad) =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${tam}" height="${tam}">
  <rect width="${tam}" height="${tam}" fill="${CARBON}"/>
  ${simbolo(tam / 2, tam / 2, tam - pad * 2, { nodo: 12, radio: 4.4, anillo: 6 })}</svg>`);
await sharp(icono(180, 14)).png().toFile('public/apple-touch-icon.png');
await sharp(icono(64, 4)).png().toFile('public/favicon.png');
console.log('Listo.');
