"""Retrato en trama de periódico para la página: la silueta sin fondo (rembg) impresa en puntos de tinta.

Es el mismo recorte de las láminas de Al Aire (al_aire.pegar_recorte), pero sobre transparente: la tinta
carbón queda como canal alfa, así que el retrato se posa sobre el papel de la página como si estuviera impreso.
Se usa para las firmas de columnistas, autores e invitados.

Uso (desde dial-web):
  python -X utf8 scripts/recorte_trama.py <foto> <salida.png> [--ancho 900] [--foco 0.5 0.35] [--zoom 1.0] [--celda 5.5]
"""
import argparse
import sys
from pathlib import Path

import numpy as np
from PIL import Image

KIT = Path("D:/Claude Code/dial-noticias")
sys.path.insert(0, str(KIT))
import al_aire  # noqa: E402  (silueta con rembg y la caché de máscaras)
import materia as mt  # noqa: E402  (semitono)


def retrato(foto, salida, ancho=900, foco=(0.5, 0.38), zoom=1.0, celda=5.5, proporcion=1.25, fondo=None):
    """fondo=None: silueta recortada. fondo=0..1: conserva el fondo, aclarado en esa proporción (0 = tal cual),
    con una transición suave alrededor de la persona; así el pelo no queda cortado (Martín, 1 nov 2026)."""
    im = Image.open(foto).convert("RGB")
    w, h = ancho, round(ancho * proporcion)
    s = max(w / im.width, h / im.height) * zoom
    cw, ch = w / s, h / s
    x0 = min(max(foco[0] * im.width - cw / 2, 0), im.width - cw)
    y0 = min(max(foco[1] * im.height - ch / 2, 0), im.height - ch)
    caja = tuple(round(v) for v in (x0, y0, x0 + cw, y0 + ch))
    alta = im.crop(caja)
    cache = Path(salida).with_name(Path(salida).stem + "-mascara.png")
    m = al_aire.silueta(alta, cache)
    alta = alta.resize((w, h), Image.LANCZOS)
    m = m.resize((w, h), Image.LANCZOS) if m else Image.new("L", (w, h), 255)
    ma = np.asarray(m, np.float32) / 255
    g = np.asarray(alta.convert("L"), np.float32) / 255
    persona = ma
    if fondo is not None:
        from PIL import ImageFilter
        suave = np.asarray(m.filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.GaussianBlur(w * 0.035)), np.float32) / 255
        g = g * suave + (1 - (1 - g) * (1 - fondo)) * (1 - suave)
        ma = np.ones_like(ma)
    dentro = g[persona > 0.5] if (persona > 0.5).any() else g.ravel()
    lo, hi = np.percentile(dentro, 3), np.percentile(dentro, 97)
    g = np.clip((g - lo) / max(hi - lo, 1e-3), 0, 1) ** 0.9
    tinta = mt.semitono(g, celda=celda, angulo=45, semilla=7) * ma
    carbon = np.array((31, 28, 25), np.uint8)
    rgba = np.dstack([np.broadcast_to(carbon, (h, w, 3)), (np.clip(tinta, 0, 1) * 255).astype(np.uint8)])
    Image.fromarray(rgba, "RGBA").save(salida, optimize=True)
    cache.unlink(missing_ok=True)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("foto")
    ap.add_argument("salida")
    ap.add_argument("--ancho", type=int, default=900)
    ap.add_argument("--foco", type=float, nargs=2, default=(0.5, 0.38))
    ap.add_argument("--zoom", type=float, default=1.0)
    ap.add_argument("--celda", type=float, default=5.5)
    ap.add_argument("--fondo", type=float, default=None, help="conserva el fondo, aclarado 0-1")
    a = ap.parse_args()
    retrato(a.foto, a.salida, a.ancho, tuple(a.foco), a.zoom, a.celda, fondo=a.fondo)
