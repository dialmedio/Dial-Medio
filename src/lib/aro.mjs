// Símbolo de Dial. Marca v5 (29 oct 2026): el aro de pluma.
// Es el aro con punto de la v4 (24 oct, el que eligió Martín) con las mismas medidas, el mismo punto y las mismas
// estaciones, pero trazado como la o de una pluma de punta ancha: grueso a los lados del eje (−28°), fino arriba y
// abajo. Lo análogo está en el dibujo mismo. El punto es la luz roja: el único color de la marca madre.
// Lo usan src/components/Simbolo.astro, scripts/generar-marca.mjs y scripts/generar-imagenes.mjs: no copiar las medidas.
// Caja de 200 × 200 con el centro en (100, 100).
export const ARO = { R: 84, trazo: 22.4, punto: 24.9, aire: 9.4, angulo: 45 };
// Por debajo de 24 px: aro más grueso y punto un poco mayor, para que no se cierre (favicon, sellos).
export const COMPACTO = { ...ARO, trazo: 32.5, punto: 26.9, aire: 6.6 };
// La pluma: el trazo de la v4 crece un 12 % en lo más grueso y baja al 42 % en lo más fino.
export const PLUMA = { eje: -28, contraste: 0.42, curva: 1.3, engrosa: 1.12 };

export function aroGeo(m = ARO, angulo = m.angulo) {
  const rc = m.R - m.trazo / 2;
  const a = ((angulo - 90) * Math.PI) / 180;
  return { rc, px: +(100 + rc * Math.cos(a)).toFixed(2), py: +(100 + rc * Math.sin(a)).toFixed(2) };
}

/** Contorno del aro de pluma (anillo con grosor variable), como datos de un path SVG con fill-rule evenodd. */
export function anillo(m = ARO, p = PLUMA) {
  const { rc } = aroGeo(m);
  const t = m.trazo * p.engrosa;
  const ext = [], int = [];
  for (let i = 0; i < 180; i++) {
    const th = (i * 2 * Math.PI) / 180;
    const g = t * (p.contraste + (1 - p.contraste) * Math.abs(Math.cos(th - (p.eje * Math.PI) / 180)) ** p.curva);
    const c = Math.cos(th), s = Math.sin(th);
    ext.push(`${(100 + (rc + g / 2) * c).toFixed(2)},${(100 + (rc + g / 2) * s).toFixed(2)}`);
    int.push(`${(100 + (rc - g / 2) * c).toFixed(2)},${(100 + (rc - g / 2) * s).toFixed(2)}`);
  }
  return `M${ext.join('L')}Z M${int.reverse().join('L')}Z`;
}

/** El aro como SVG (sin la etiqueta <svg>). `id` debe ser único si hay varios en la misma página.
 *  `angulo` gira el punto a la estación de cada línea (solo la mitad de arriba: abajo a la derecha se lee como Q).
 *  Con `clases`, el círculo de la máscara que revela el trazo lleva .aro-trazo (Simbolo.astro lo anima). */
export function aro(color, { compacto = false, centro = '#D4512E', id = 'aro', angulo, clases = false } = {}) {
  const m = compacto ? COMPACTO : ARO;
  const { rc, px, py } = aroGeo(m, angulo ?? m.angulo);
  const c = (n) => (clases ? ` class="${n}"` : '');
  const giro = (angulo ?? m.angulo) - 90 - 8;
  return `<mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="200"><rect width="200" height="200" fill="#fff"/><circle cx="${px}" cy="${py}" r="${+(m.punto + m.aire).toFixed(2)}" fill="#000"/></mask>`
    + `<mask id="${id}-t" maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="200"><circle${c('aro-trazo')} cx="100" cy="100" r="${+rc.toFixed(2)}" fill="none" stroke="#fff" stroke-width="${(m.trazo * 2.4).toFixed(1)}" pathLength="1" transform="rotate(${giro} 100 100)"/></mask>`
    + `<g mask="url(#${id})"><path${c('aro-anillo')} d="${anillo(m)}" fill="${color}" fill-rule="evenodd" mask="url(#${id}-t)"/></g>`
    + `<circle${c('aro-punto')} cx="${px}" cy="${py}" r="${m.punto}" fill="${centro}"/>`;
}
