// Exporta /marca a PDF. Uso: npx astro preview --port 4350 & node scripts/exportar-manual.mjs [ruta-salida]
import puppeteer from 'puppeteer-core';
import { existsSync } from 'node:fs';
const salida = process.argv[2] ?? 'Manual de marca Dial v3.pdf';
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
const b = await puppeteer.launch({ executablePath: CHROME, headless: true });
const p = await b.newPage();
await p.setViewport({ width: 1280, height: 900 });
await p.goto('http://localhost:4350/marca', { waitUntil: 'networkidle0' });
await p.emulateMediaType('screen');
await p.addStyleTag({ content: '.cabecera,.pie{display:none!important}*,*::before,*::after{animation:none!important;transition:none!important}[data-revela]{opacity:1!important;transform:none!important}canvas{display:none}.simbolo .nodos circle,.simbolo .centro{transform:none!important}.simbolo line{stroke-dashoffset:0!important}' });
await p.evaluate(() => document.fonts.ready);
const alto = await p.evaluate(() => document.documentElement.scrollHeight);
await p.evaluate(() => document.querySelectorAll('a[href^="/"]').forEach((a) => (a.href = 'https://dialmedio.org' + a.getAttribute('href'))));
await p.pdf({ path: salida, width: '1280px', height: `${alto + 2}px`, printBackground: true, pageRanges: '1' });
await b.close();
console.log('PDF:', salida);
