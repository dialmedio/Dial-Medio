// Genera las imágenes para compartir (public/og/*.jpg, public/og.jpg) y los íconos, con la marca v5 (29 oct 2026: la pluma).
// Renderiza HTML con las mismas fuentes del sitio usando Chrome (puppeteer-core).
// Uso: node scripts/generar-imagenes.mjs   (necesita Google Chrome instalado)
import puppeteer from 'puppeteer-core';
import { aro } from '../src/lib/aro.mjs';
import sharp from 'sharp';
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { readdirSync } from 'node:fs';
import yaml from 'js-yaml';
import { resolve } from 'node:path';

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome'].find(existsSync);
const logo = JSON.parse(readFileSync('src/data/logotipo.json', 'utf8'));
const f = (p) => pathToFileURL(resolve('node_modules', p)).href;

const C = { carbon: '#1f1c19', papel: '#f4eee5', hueso: '#f4eee5', ceniza: '#b5aca0', terracota: '#d4512e', clara: '#e0653f', brasa: '#e58a3a' };

// Cada página: rótulo, título (admite <em>) y bajada.
// 1 nov 2026: Martín pidió que al pegar el enlace en un chat salga algo más llamativo, "quizás con que salga el logo".
// Tarjeta de logotipo: el «dial» grande al centro (sobrevive al recorte cuadrado de WhatsApp) y debajo, la sección.
const paginas = {
  inicio: { rotulo: 'Análisis · Opinión · Documental' },
  noticias: { rotulo: 'Noticias con contexto' },
  opinion: { rotulo: 'Opinión' },
  podcast: { rotulo: 'Podcast · Con la RED Quynza' },
  documentales: { rotulo: 'Documentales' },
  laboratorio: { rotulo: 'Laboratorio · Debates' },
  principios: { rotulo: 'Principios editoriales' },
  nosotros: { rotulo: 'Nosotros' },
  contacto: { rotulo: 'Escríbenos' },
  estudio: { rotulo: 'Productora audiovisual', linea: 'estudio' },
  impacto: { rotulo: 'Documental y cobertura', linea: 'estudio' },
  medicion: { rotulo: 'Pieza + medición', linea: 'estudio' },
  encuentros: { rotulo: 'Encuentros · Eventos', linea: 'estudio' },
  celebraciones: { rotulo: 'Celebraciones', linea: 'estudio' },
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

const htmlLogo = (p) => html(p)
  .replace(/<body>[\s\S]*<\/body>/, `<body class="logo">
<div class="centro">
  <div class="firma">${palabra(p.linea ? 150 : 230, p.linea)}</div>
  <div class="rot">${p.rotulo}</div>
</div>
<div class="pie">DIALMEDIO.ORG</div>
</body>`)
  .replace('</style>', `
body.logo { background: radial-gradient(ellipse 70% 80% at 50% 46%, #2b2622 0%, ${C.carbon} 70%); }
.centro { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 34px; padding-bottom: 24px; }
.firma svg { display: block; filter: drop-shadow(0 0 0 transparent); }
.firma circle { filter: drop-shadow(0 0 18px rgba(212,81,46,.75)); }
.rot { font: 600 19px IS; letter-spacing: .28em; text-transform: uppercase; color: ${C.ceniza}; display: flex; align-items: center; gap: 16px; }
.rot::before, .rot::after { content: ''; width: 46px; height: 1px; background: ${C.ceniza}; opacity: .5; }
.pie { position: absolute; left: 0; right: 0; bottom: 40px; text-align: center; font: 600 14px IS; letter-spacing: .3em; color: ${C.ceniza}; opacity: .7; }
</style>`);

mkdirSync('public/og', { recursive: true });
const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--allow-file-access-from-files'] });
const pg = await b.newPage();
await pg.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
for (const [slug, p] of Object.entries(paginas)) {
  const tmp = resolve('scripts/.og-tmp.html');
  writeFileSync(tmp, htmlLogo(p));
  await pg.goto(pathToFileURL(tmp).href, { waitUntil: 'load' });
  await pg.evaluate(() => document.fonts.ready);
  await pg.screenshot({ path: `public/og/${slug}.jpg`, type: 'jpeg', quality: 86 });
  console.log(`og/${slug}.jpg`);
}

// ---------- Tarjetas por pieza (1 nov 2026): la foto revelada de la noticia con su titular y el logotipo,
// y para las columnas, el retrato en trama con el titular. Se guardan en public/og/piezas/ y public/og/opinion/;
// las páginas las usan si existen. Correr después de importar noticias o de publicar una columna.
const frente = (ruta) => yaml.load(readFileSync(ruta, 'utf8').split(/^---\s*$/m)[1]);
const acento = (t) => t.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]).replace(/\*([^*]+)\*/g, '<em>$1</em>');
const tamTitulo = (t) => (t.length > 70 ? 54 : t.length > 45 ? 64 : 76);
const htmlPieza = ({ foto, foco, titulo, rotulo }) =>
  html({}).replace(/<body>[\s\S]*<\/body>/, `<body class="pieza">
<img class="fondo" src="${pathToFileURL(resolve(foto)).href}" style="object-position:${foco}">
<div class="velo"></div>
<div class="marca">${palabra(40)}</div>
<div class="texto"><div class="k">${rotulo}</div><h1 style="font-size:${tamTitulo(titulo)}px">${acento(titulo)}</h1></div>
</body>`).replace('</style>', `
body.pieza::after { opacity: .07; }
.fondo { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.velo { position: absolute; inset: 0; background: linear-gradient(0deg, rgba(20,17,15,.92) 0%, rgba(20,17,15,.55) 38%, rgba(20,17,15,0) 62%), linear-gradient(180deg, rgba(20,17,15,.55) 0%, rgba(20,17,15,0) 22%); }
.pieza .marca { left: 56px; top: 44px; }
.texto { position: absolute; left: 56px; right: 90px; bottom: 50px; }
.texto h1 { margin-top: 14px; max-width: 1000px; text-wrap: balance; text-shadow: 0 2px 18px rgba(0,0,0,.35); }
.texto .k { color: #e8dfd2; }
</style>`);
const htmlColumna = ({ retrato, titulo, autor }) =>
  html({}).replace(/<body>[\s\S]*<\/body>/, `<body class="columna">
<div class="marca">${palabra(40)}</div>
<div class="texto"><div class="k">Opinión · ${autor}</div><h1 style="font-size:${tamTitulo(titulo) + 4}px">${acento(titulo)}</h1></div>
<div class="papel"><img src="${pathToFileURL(resolve(retrato)).href}"></div>
</body>`).replace('</style>', `
.columna .marca { left: 64px; top: 52px; }
.columna .texto { position: absolute; left: 64px; top: 170px; width: 640px; }
.columna .texto h1 { margin-top: 18px; text-wrap: balance; }
.papel { position: absolute; right: 0; top: 0; bottom: 0; width: 420px; background: ${C.papel}; display: flex; align-items: flex-end; justify-content: center; overflow: hidden; }
.papel img { width: 100%; height: 100%; object-fit: cover; object-position: 50% 30%; }
</style>`);

const piezas = [];
for (const d of existsSync('src/content/noticias') ? readdirSync('src/content/noticias') : []) {
  const md = `src/content/noticias/${d}/index.md`;
  if (!existsSync(md)) continue;
  const fm = frente(md);
  if (fm.borrador) continue;
  const lin = { 'al-aire': 'Al Aire', termometro: 'Termómetro', expediente: 'Expediente', 'tecnologia-y-poder': 'Tecnología y poder', 'nuevos-mundos': 'Nuevos mundos posibles', 'arte-y-memoria': 'Arte y memoria' }[fm.linea];
  const reg = { 'america-latina': 'América Latina', mundo: 'Mundo' }[fm.region];
  piezas.push({ salida: `public/og/piezas/${d}.jpg`, html: htmlPieza({ foto: `src/content/noticias/${d}/${fm.portada.replace(/^\.\//, '')}`, foco: fm.foco || '50% 50%', titulo: fm.titulo, rotulo: reg ?? lin }) });
}
for (const a of existsSync('src/content/opinion') ? readdirSync('src/content/opinion') : []) {
  if (a.startsWith('_') || !a.endsWith('.md')) continue;
  const fm = frente(`src/content/opinion/${a}`);
  if (fm.borrador) continue;
  const autor = JSON.parse(readFileSync(`src/content/autores/${fm.autor}.json`, 'utf8'));
  piezas.push({ salida: `public/og/opinion/${a.replace(/\.md$/, '')}.jpg`, html: htmlColumna({ retrato: `src/content/autores/${autor.retrato.replace(/^\.\//, '')}`, titulo: fm.titulo, autor: autor.nombre }) });
}
mkdirSync('public/og/piezas', { recursive: true });
mkdirSync('public/og/opinion', { recursive: true });
for (const pz of piezas) {
  const tmp = resolve('scripts/.og-tmp.html');
  writeFileSync(tmp, pz.html);
  await pg.goto(pathToFileURL(tmp).href, { waitUntil: 'load' });
  await pg.evaluate(() => document.fonts.ready);
  await pg.screenshot({ path: pz.salida, type: 'jpeg', quality: 82 });
}
console.log(`${piezas.length} tarjetas de piezas`);
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
