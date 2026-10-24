// Símbolo de Dial desde el 24 oct 2026: el aro con punto (marca v4).
// Lo eligió Martín entre la perilla, el aro y la D sola. Reemplaza a "una voz, diez alrededor", que nació del debate.
// Un aro y, montado sobre él a 45°, el punto terracota de la i del logotipo, separado del aro por un respiro
// (el mismo aire que separa el punto de la i de su asta). Es un dial ya sintonizado.
// Lo usan src/components/Simbolo.astro, scripts/generar-marca.mjs y scripts/generar-imagenes.mjs: no copiar las medidas.
// Caja de 200 × 200 con el centro en (100, 100).
export const ARO = { R: 84, trazo: 22.4, punto: 24.9, aire: 9.4, angulo: 45 };
// Por debajo de 24 px: aro más grueso y punto un poco mayor, para que no se cierre (favicon, sellos).
export const COMPACTO = { ...ARO, trazo: 32.5, punto: 26.9, aire: 6.6 };

export function aroGeo(m = ARO, angulo = m.angulo) {
  const rc = m.R - m.trazo / 2;
  const a = ((angulo - 90) * Math.PI) / 180;
  return { rc, px: +(100 + rc * Math.cos(a)).toFixed(2), py: +(100 + rc * Math.sin(a)).toFixed(2) };
}

/** El aro como SVG (sin la etiqueta <svg>). `id` debe ser único si hay varios en la misma página. */
export function aro(color, { compacto = false, centro = '#C0442A', id = 'aro', angulo, clases = false } = {}) {
  const m = compacto ? COMPACTO : ARO;
  const { rc, px, py } = aroGeo(m, angulo ?? m.angulo);
  const c = (n) => (clases ? ` class="${n}"` : '');
  return `<mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="200"><rect width="200" height="200" fill="#fff"/><circle cx="${px}" cy="${py}" r="${+(m.punto + m.aire).toFixed(2)}" fill="#000"/></mask>`
    + `<g mask="url(#${id})"><circle${c('aro-trazo')} cx="100" cy="100" r="${+rc.toFixed(2)}" fill="none" stroke="${color}" stroke-width="${m.trazo}" pathLength="1" transform="rotate(-45 100 100)"/></g>`
    + `<circle${c('aro-punto')} cx="${px}" cy="${py}" r="${m.punto}" fill="${centro}"/>`;
}
