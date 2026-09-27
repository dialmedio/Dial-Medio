// Genera la imagen para compartir (public/og.png) y los íconos PNG.
// Uso: node scripts/generar-imagenes.mjs  (requiere Anton y Space Mono instaladas en el sistema)
import sharp from 'sharp';
import { readFileSync, existsSync } from 'node:fs';

const CARBON = '#1a1613', TERRACOTA = '#c1502e', HUESO = '#e8dfd0';
const fuentes = [process.env.LOCALAPPDATA + '/Microsoft/Windows/Fonts', 'C:/Windows/Fonts'];
const fuente = (n) => fuentes.map((d) => `${d}/${n}`).find(existsSync);

const simbolo = (cx, cy, s, { nodo = 6.2, radio = 1.1, anillo = 2, color = HUESO } = {}) => {
  const k = s / 200, pts = [];
  for (let i = 0; i < 10; i++) {
    const a = ((-90 + i * 36) * Math.PI) / 180;
    pts.push([cx + 64 * k * Math.cos(a), cy + 64 * k * Math.sin(a)]);
  }
  return `
  <g stroke="${color}" stroke-width="${radio * k}" stroke-linecap="round" opacity=".85">${pts.map(([x, y]) => `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}"/>`).join('')}</g>
  <circle cx="${cx}" cy="${cy}" r="${20 * k}" fill="none" stroke="${color}" stroke-width="${anillo * k}"/>
  <g fill="${color}">${pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${nodo * k}"/>`).join('')}</g>
  <circle cx="${cx}" cy="${cy}" r="${9.4 * k}" fill="${TERRACOTA}" stroke="${color}" stroke-width="${k}"/>`;
};

const texto = async (t, fontfile, font, dpi = 72) =>
  sharp({ text: { text: t, fontfile, font, rgba: true, dpi } }).png().toBuffer();

// --- OG 1200x630 ---
const base = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="${CARBON}"/>
  ${simbolo(930, 315, 520)}
  <rect x="72" y="470" width="56" height="3" fill="${TERRACOTA}"/>
</svg>`);

const anton = fuente('Anton-Regular.ttf'), mono = fuente('SpaceMono-Regular.ttf');
if (!anton || !mono) throw new Error('Faltan fuentes Anton / Space Mono en el sistema.');

const dial = await texto(`<span foreground="${HUESO}">DIAL</span>`, anton, 'Anton 150', 72);
const promesa = await texto(`<span foreground="${HUESO}">CONTAMOS, <span foreground="${TERRACOTA}">Y MEDIMOS,</span>\nEL ENCUENTRO HUMANO.</span>`, anton, 'Anton 44', 72);
const tag = await texto(`<span foreground="${TERRACOTA}">—Del ruido a la señal</span>`, mono, 'Space Mono 22', 72);

await sharp(base)
  .composite([
    { input: dial, left: 68, top: 70 },
    { input: promesa, left: 72, top: 300 },
    { input: tag, left: 72, top: 500 },
  ])
  .png({ compressionLevel: 9 })
  .toFile('public/og.png');

// --- Íconos ---
const icono = (tam, pad) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${tam}" height="${tam}">
  <rect width="${tam}" height="${tam}" fill="${CARBON}"/>
  ${simbolo(tam / 2, tam / 2, tam - pad * 2, { nodo: 12, radio: 4.4, anillo: 6 })}</svg>`);
await sharp(icono(180, 14)).png().toFile('public/apple-touch-icon.png');
await sharp(icono(64, 4)).png().toFile('public/favicon.png');
console.log('Listo: public/og.png, public/apple-touch-icon.png, public/favicon.png');
