// Genera las imágenes para compartir (public/og/*.jpg, public/og.jpg) y los íconos, con la marca v3.
// Renderiza HTML con las mismas fuentes del sitio usando Chrome (puppeteer-core).
// Uso: node scripts/generar-imagenes.mjs   (necesita Google Chrome instalado)
import puppeteer from 'puppeteer-core';
import sharp from 'sharp';
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome'].find(existsSync);
const logo = JSON.parse(readFileSync('src/data/logotipo.json', 'utf8'));
const f = (p) => pathToFileURL(resolve('node_modules', p)).href;

const C = { carbon: '#17130f', papel: '#f4eee5', hueso: '#e9dfcf', ceniza: '#b3a897', terracota: '#c0442a', clara: '#e0694a', brasa: '#e58a3a' };

// Cada página: rótulo, título (admite <em>) y bajada.
const paginas = {
  inicio: { kicker: 'Productora audiovisual · Bogotá', titulo: 'Contamos, <em>y medimos,</em><br>el encuentro humano.', sub: 'Documental, cobertura, eventos y un medio propio de debates.' },
  impacto: { kicker: 'Dial Impacto', titulo: 'Historias para organizaciones que <em>transforman.</em>', sub: 'Documental · Cobertura · Pieza + medición · Marca con propósito' },
  medicion: { kicker: 'Dial Impacto · Pieza + medición', titulo: 'Medimos lo que una historia <em>mueve.</em>', sub: 'Evaluación antes y después de ver la pieza, lista para reportar.' },
  encuentros: { kicker: 'Dial Encuentros', titulo: 'Producimos el encuentro. Y lo dejamos <em>contado.</em>', sub: 'Foros · Festivales · Lanzamientos · Música en vivo' },
  celebraciones: { kicker: 'Dial Encuentros · Celebraciones', titulo: 'Lo que se celebra una vez, <em>se queda contado.</em>', sub: 'Bodas · Aniversarios · Serenatas', serif: true },
  medio: { kicker: 'Obra propia · Sintonizar es conversar', titulo: '', sub: 'Debates entre sectores enfrentados, videopodcast y documentales.', linea: 'medio' },
  nosotros: { kicker: 'Nosotros', titulo: 'Un solo equipo, de la idea al <em>estreno.</em>', sub: 'Dirección, imagen, sonido y música original, en casa.' },
  contacto: { kicker: 'Cotizaciones a la medida', titulo: 'Cuéntanos qué quieres <em>contar.</em>', sub: 'dialmediocol@gmail.com · WhatsApp +57 310 481 3624' },
};

const simbolo = (color, s) => {
  const R = 72, rNodo = 10.5, rCentro = 18, hueco = 30, trazo = 4.2;
  const ang = [...Array(10)].map((_, i) => ((-90 + i * 36) * Math.PI) / 180);
  const p = (a, d) => [100 + d * Math.cos(a), 100 + d * Math.sin(a)].map((v) => +v.toFixed(2));
  return `<svg viewBox="0 0 200 200" width="${s}" height="${s}"><g stroke="${color}" stroke-width="${trazo}" stroke-linecap="round">${ang
    .map((a) => { const [x1, y1] = p(a, hueco); const [x2, y2] = p(a, R - rNodo - 7); return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`; })
    .join('')}</g><g fill="${color}">${ang.map((a) => { const [cx, cy] = p(a, R); return `<circle cx="${cx}" cy="${cy}" r="${rNodo}"/>`; }).join('')}</g><circle cx="100" cy="100" r="${rCentro}" fill="${C.terracota}"/></svg>`;
};
const palabra = (alto) => `<svg viewBox="${logo.viewBox}" height="${alto}" style="overflow:visible"><path d="${logo.d}" fill="${C.hueso}"/><circle cx="${logo.punto.cx}" cy="${logo.punto.cy}" r="${logo.punto.r}" fill="${C.terracota}"/></svg>`;

const regla = () => {
  let t = '';
  for (let fr = 540; fr <= 1700; fr += 10) {
    const x = ((fr - 530) / 1170) * 100;
    const h = fr % 100 === 0 ? 22 : fr % 50 === 0 ? 14 : 8;
    const o = fr % 100 === 0 ? 0.7 : fr % 50 === 0 ? 0.42 : 0.22;
    t += `<i style="left:${x}%;height:${h}px;opacity:${o}"></i>`;
  }
  return `<div class="regla">${t}<b style="left:${((810 - 530) / 1170) * 100}%"></b></div>`;
};

const html = (p) => `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: IS; src: url(${f('@fontsource-variable/instrument-sans/files/instrument-sans-latin-standard-normal.woff2')}) format('woff2'); font-weight: 400 700; font-stretch: 75% 100%; }
@font-face { font-family: ISerif; font-style: italic; src: url(${f('@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2')}) format('woff2'); }
@font-face { font-family: ISerif; font-style: normal; src: url(${f('@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff2')}) format('woff2'); }
@font-face { font-family: Plex; src: url(${f('@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2')}) format('woff2'); font-weight: 500; }
* { margin: 0; box-sizing: border-box; }
body { width: 1200px; height: 630px; background: ${C.carbon}; color: ${C.hueso}; font-family: IS; position: relative; overflow: hidden; }
body::after { content: ''; position: absolute; inset: 0; opacity: .12; mix-blend-mode: overlay; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1.4 -.2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }
.marca { position: absolute; left: 72px; top: 64px; }
.url { position: absolute; right: 72px; top: 76px; font: 500 15px Plex; letter-spacing: .14em; color: ${C.brasa}; }
.simbolo { position: absolute; right: 64px; top: 150px; }
.cuerpo { position: absolute; left: 72px; top: 158px; width: 720px; }
.k { font: 500 15px Plex; letter-spacing: .12em; text-transform: uppercase; color: ${C.clara}; display: flex; gap: 14px; align-items: center; }
.k::before { content: ''; width: 36px; height: 2px; background: ${C.terracota}; }
h1 { margin-top: 22px; font-weight: 600; font-stretch: 84%; font-size: 76px; line-height: .98; letter-spacing: -.024em; }
h1.serif { font-family: ISerif; font-weight: 400; font-stretch: normal; font-size: 84px; letter-spacing: -.01em; line-height: 1; }
h1 em { font-family: ISerif; font-style: italic; font-weight: 400; color: ${C.terracota}; font-size: 1.05em; letter-spacing: -.01em; }
.linea { margin-top: 26px; display: flex; align-items: baseline; gap: 24px; }
.linea em { font-family: ISerif; font-style: italic; font-size: 150px; line-height: 1; color: ${C.terracota}; }
p { margin-top: 22px; font-size: 25px; line-height: 1.35; color: ${C.ceniza}; max-width: 680px; }
.regla { position: absolute; left: 72px; right: 72px; bottom: 44px; height: 30px; }
.regla i { position: absolute; bottom: 0; width: 1.2px; background: ${C.hueso}; }
.regla b { position: absolute; bottom: -2px; width: 3px; height: 40px; background: ${C.terracota}; box-shadow: 0 0 14px rgba(192,68,42,.6); }
.regla b::before { content: ''; position: absolute; top: -6px; left: -4.5px; width: 12px; height: 12px; border-radius: 50%; background: ${C.terracota}; }
</style></head><body>
${p.linea ? '' : `<div class="marca">${palabra(46)}</div>`}
<div class="url">DIALMEDIO.ORG · 810 AM</div>
<div class="simbolo">${simbolo(C.hueso, 300)}</div>
<div class="cuerpo">
  <div class="k">${p.kicker}</div>
  ${p.linea ? `<div class="linea">${palabra(150)}<em>${p.linea}</em></div>` : `<h1 class="${p.serif ? 'serif' : ''}">${p.titulo}</h1>`}
  <p>${p.sub}</p>
</div>
${regla()}
</body></html>`;

mkdirSync('public/og', { recursive: true });
const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--allow-file-access-from-files'] });
const pg = await b.newPage();
await pg.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
for (const [slug, p] of Object.entries(paginas)) {
  const tmp = resolve('scripts/.og-tmp.html');
  writeFileSync(tmp, html(p));
  await pg.goto(pathToFileURL(tmp).href, { waitUntil: 'load' });
  await pg.evaluate(() => document.fonts.ready);
  await pg.screenshot({ path: `public/og/${slug}.jpg`, type: 'jpeg', quality: 86 });
  console.log(`og/${slug}.jpg`);
}
await b.close();
rmSync(resolve('scripts/.og-tmp.html'), { force: true });
await sharp('public/og/inicio.jpg').toFile('public/og.jpg');

// ---------- Íconos: símbolo compacto sobre carbón ----------
const icono = (tam, radios) => {
  const R = 72, rNodo = radios ? 10.5 : 13.6, rCentro = radios ? 18 : 24, hueco = 30, trazo = 4.2;
  const ang = [...Array(10)].map((_, i) => ((-90 + i * 36) * Math.PI) / 180);
  const p = (a, d) => [100 + d * Math.cos(a), 100 + d * Math.sin(a)].map((v) => +v.toFixed(2));
  const lineas = radios ? `<g stroke="${C.hueso}" stroke-width="${trazo}" stroke-linecap="round">${ang.map((a) => { const [x1, y1] = p(a, hueco); const [x2, y2] = p(a, R - rNodo - 7); return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`; }).join('')}</g>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="${tam}" height="${tam}"><rect width="200" height="200" rx="${tam > 100 ? 0 : 40}" fill="${C.carbon}"/><g transform="translate(14 14) scale(.86)">${lineas}<g fill="${C.hueso}">${ang.map((a) => { const [cx, cy] = p(a, R); return `<circle cx="${cx}" cy="${cy}" r="${rNodo}"/>`; }).join('')}</g><circle cx="100" cy="100" r="${rCentro}" fill="${C.terracota}"/></g></svg>`;
};
writeFileSync('public/favicon.svg', icono(64, false));
await sharp(Buffer.from(icono(180, true))).png().toFile('public/apple-touch-icon.png');
await sharp(Buffer.from(icono(64, false))).png().toFile('public/favicon.png');
console.log('Listo.');
