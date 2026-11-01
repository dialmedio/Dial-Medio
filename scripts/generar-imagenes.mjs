// Genera las imágenes para compartir (public/og/*.jpg, public/og.jpg) y los íconos, con la marca v5 (29 oct 2026: la pluma).
// Renderiza HTML con las mismas fuentes del sitio usando Chrome (puppeteer-core).
// Uso: node scripts/generar-imagenes.mjs   (necesita Google Chrome instalado)
import puppeteer from 'puppeteer-core';
import { aro } from '../src/lib/aro.mjs';
import sharp from 'sharp';
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome'].find(existsSync);
const logo = JSON.parse(readFileSync('src/data/logotipo.json', 'utf8'));
const f = (p) => pathToFileURL(resolve('node_modules', p)).href;

const C = { carbon: '#1f1c19', papel: '#f4eee5', hueso: '#f4eee5', ceniza: '#b5aca0', terracota: '#d4512e', clara: '#e0653f', brasa: '#e58a3a' };

// Cada página: rótulo, título (admite <em>) y bajada.
const paginas = {
  inicio: { kicker: 'Medio independiente · Bogotá', titulo: 'Análisis, no <em>primicia.</em>', sub: 'Noticias con contexto, opinión, podcast, documentales y debates.' },
  noticias: { kicker: 'Noticias', titulo: 'No contamos primero: contamos <em>completo.</em>', sub: 'Colombia, América Latina y el mundo, con fuentes.' },
  opinion: { kicker: 'Opinión', titulo: 'Ideas con argumentos, <em>y con nombre propio.</em>', sub: 'Columnas con firma. Escribe en Dial.' },
  podcast: { kicker: 'Podcast · Con la RED Quynza', titulo: 'Lo que la gente quiere es <em>vivir.</em>', sub: 'Conversaciones largas con quienes construyen paz.' },
  documentales: { kicker: 'Documentales', titulo: 'Historias que piden <em>tiempo.</em>', sub: 'Música, territorio y memoria.' },
  laboratorio: { kicker: 'Laboratorio', titulo: 'No quién ganó, sino <em>quién cambió.</em>', sub: 'Debates y experimentos de conversación.' },
  principios: { kicker: 'Principios editoriales', titulo: 'Lo que puedes <em>exigirnos.</em>', sub: 'Fuentes a la vista, las partes siempre, correcciones visibles.' },
  nosotros: { kicker: 'Nosotros', titulo: 'Un lugar para <em>entender.</em>', sub: 'Medio independiente hecho en Bogotá.' },
  estudio: { kicker: 'Productora audiovisual · Bogotá', titulo: '', sub: 'Documental, cobertura y eventos para organizaciones. Contamos, y medimos, el encuentro humano.', linea: 'estudio' },
  impacto: { kicker: 'Dial Estudio · Impacto', titulo: 'Historias para organizaciones que <em>transforman.</em>', sub: 'Documental · Cobertura · Pieza + medición · Marca con propósito' },
  medicion: { kicker: 'Dial Estudio · Pieza + medición', titulo: 'Medimos lo que una historia <em>mueve.</em>', sub: 'Evaluación antes y después de ver la pieza, lista para reportar.' },
  encuentros: { kicker: 'Dial Estudio · Encuentros', titulo: 'Producimos el encuentro. Y lo dejamos <em>contado.</em>', sub: 'Foros · Festivales · Lanzamientos · Música en vivo' },
  celebraciones: { kicker: 'Dial Encuentros · Celebraciones', titulo: 'Lo que se celebra una vez, <em>se queda contado.</em>', sub: 'Bodas · Aniversarios · Serenatas', serif: true },
  contacto: { kicker: 'Escríbenos', titulo: 'Cuéntanos qué quieres <em>contar.</em>', sub: 'dialmediocol@gmail.com · WhatsApp +57 310 481 3624' },
};

// El símbolo es el aro de pluma (marca v5); geometría en src/lib/aro.mjs
let nAro = 0;
const simbolo = (color, s) => `<svg viewBox="0 0 200 200" width="${s}" height="${s}" style="overflow:visible">${aro(color, { centro: C.terracota, id: `aro${nAro++}` })}</svg>`;
const palabra = (alto, linea) => {
  // «dial» y, si hay, el apellido en Fraunces cursiva y en la misma tinta (logotipo.json trae sus trazos)
  const [vx, vy, vw, vh] = logo.viewBox.split(' ').map(Number);
  const ap = linea ? logo.lineas[linea] : null;
  const ancho = ap ? vw + logo.aireLinea + ap.ancho : vw;
  return `<svg viewBox="${vx} ${vy} ${ancho} ${vh}" height="${alto}" style="overflow:visible"><path d="${logo.d}" fill="${C.hueso}"/><circle cx="${logo.punto.cx}" cy="${logo.punto.cy}" r="${logo.punto.r}" fill="${C.terracota}"/>${ap ? `<path transform="translate(${vw + logo.aireLinea} 0)" d="${ap.d}" fill="${C.hueso}"/>` : ''}</svg>`;
};

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
@font-face { font-family: Brico; src: url(${f('@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-standard-normal.woff2')}) format('woff2'); font-weight: 200 800; font-stretch: 75% 100%; }
@font-face { font-family: ISerif; font-style: italic; src: url(${f('@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2')}) format('woff2'); }
@font-face { font-family: ISerif; font-style: normal; src: url(${f('@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff2')}) format('woff2'); }
* { margin: 0; box-sizing: border-box; }
body { width: 1200px; height: 630px; background: ${C.carbon}; color: ${C.hueso}; font-family: Brico; font-stretch: 92%; position: relative; overflow: hidden; }
body::after { content: ''; position: absolute; inset: 0; opacity: .1; mix-blend-mode: screen; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1.4 -.2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }
.marca { position: absolute; left: 72px; top: 64px; }
.url { position: absolute; right: 72px; top: 78px; font: 600 15px IS; letter-spacing: .16em; color: ${C.ceniza}; }
.simbolo { position: absolute; right: 64px; top: 150px; }
.cuerpo { position: absolute; left: 72px; top: 158px; width: 720px; }
.k { font: 600 15px IS; letter-spacing: .16em; text-transform: uppercase; color: ${C.ceniza}; display: flex; gap: 14px; align-items: center; }
.k::before { content: ''; width: 10px; height: 10px; border-radius: 50%; background: ${C.terracota}; }
h1 { margin-top: 22px; font-family: ISerif; font-weight: 400; font-size: 86px; line-height: .98; letter-spacing: -.012em; }
h1.serif { font-size: 86px; }
h1 em { font-family: ISerif; font-style: italic; font-weight: 400; letter-spacing: -.005em; }
.linea { margin-top: 26px; }
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
  ${p.linea ? `<div class="linea">${palabra(112, p.linea)}</div>` : `<h1 class="${p.serif ? 'serif' : ''}">${p.titulo}</h1>`}
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

// ---------- Íconos: el aro sobre carbón (compacto en el favicon) ----------
const icono = (tam, completo) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="${tam}" height="${tam}"><rect width="200" height="200" rx="${tam > 100 ? 0 : 40}" fill="${C.carbon}"/><g transform="translate(22 22) scale(.78)">${aro(C.hueso, { compacto: !completo, centro: C.terracota, id: 'icono' })}</g></svg>`;
writeFileSync('public/favicon.svg', icono(64, false));
await sharp(Buffer.from(icono(180, true))).png().toFile('public/apple-touch-icon.png');
await sharp(Buffer.from(icono(64, false))).png().toFile('public/favicon.png');
console.log('Listo.');
