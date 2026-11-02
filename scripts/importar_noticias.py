"""Importa a la página las piezas de noticias ya producidas (Al Aire, Termómetro, Arte y memoria, Expediente).

Cada pieza vive en D:/AA Dialmedio/Noticias/<Línea>/<carpeta> con sus láminas y su descripción, y su JSON en
dial-noticias/noticias/ (o dial-expediente/ediciones/). Este script arma, por pieza, una carpeta en
src/content/noticias/<slug>/ con:

  index.md     texto completo (la descripción de Instagram sin hashtags), fuentes y créditos
  portada.jpg  la foto de la portada, limpia (sin letras), revelada con la misma película de las láminas
  laminas/     las láminas del carrusel tal como salieron en Instagram

Uso (desde dial-web):
  python -X utf8 scripts/importar_noticias.py                  importa lo que falte, hasta hoy
  python -X utf8 scripts/importar_noticias.py --hasta 2026-11-03
  python -X utf8 scripts/importar_noticias.py --forzar <slug>  rehace una pieza (pisa lo editado a mano)

Lo que ya existe no se toca: después de importar, el index.md se puede corregir a mano.
"""
import argparse
import datetime as dt
import json
import re
import shutil
import sys
import unicodedata
import zlib
from pathlib import Path

from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
DESTINO = RAIZ / "src/content/noticias"
NOTICIAS = Path("D:/AA Dialmedio/Noticias")
KIT = Path("D:/Claude Code/dial-noticias")
EXPEDIENTE = Path("D:/Claude Code/dial-expediente")

sys.path.insert(0, str(KIT))
import dial_noticias as dn  # noqa: E402  (la película y la colorización de las láminas)

# Piezas que no entran: muestras de diseño, versiones repetidas y videos armados con material de agencias.
FUERA = {
    "2026-10-17-planton-museo.json",          # versión horizontal; vale la 4:5
    "2026-10-18-protestas-mundo.json",        # primera versión; vale la v2
    "2026-10-24-mundos-muestra.json",
    "2026-10-25-tec-muestra-urna-brasil.json",
    "2026-10-25-lula-remonta-video.json",
    "2026-10-25-serbia-estudiantes.json",
    "2026-10-26-brasil-celebra.json",
}
LINEAS = {None: "al-aire", "nuevos-mundos": "termometro", "arte": "arte-y-memoria",
          "tecnologia": "tecnologia-y-poder", "mundos": "nuevos-mundos"}
MESES = {m: i + 1 for i, m in enumerate("ENE FEB MAR ABR MAY JUN JUL AGO SEP OCT NOV DIC".split())}
LADO = 2400  # lado largo de la portada; Astro saca de ahí las versiones livianas


def slug(texto):
    t = unicodedata.normalize("NFKD", texto.lower()).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", t).strip("-")[:80].rstrip("-")


def nombre_propio(texto):
    minus = {"de", "del", "la", "las", "los", "y", "en"}
    return " ".join(p if i and p.lower() in minus else p.capitalize() for i, p in enumerate(texto.lower().split()))


def yaml_str(s):
    return json.dumps(s, ensure_ascii=False)


def seccion(md, nombre):
    """Texto de una sección '## Nombre…' de la descripción (sin las cercas ```)."""
    m = re.search(rf"^## {nombre}[^\n]*\n(.*?)(?=^## |\Z)", md, re.S | re.M)
    if not m:
        return ""
    return re.sub(r"^```\w*\s*$", "", m.group(1), flags=re.M).strip()


def cuerpo_instagram(ig):
    """El texto de Instagram como artículo: sin hashtags ni créditos, con subtítulos y listas."""
    parrafos, pregunta = [], None
    for bloque in re.split(r"\n\s*\n", ig.strip()):
        lineas = [l.strip() for l in bloque.split("\n") if l.strip()]
        salida = []
        for l in lineas:
            if l.startswith("#") or re.match(r"^(Fotos?( de portada)?|Seguimiento|Próxima edición|Video)\s*:", l):
                continue
            if l.startswith("📍"):
                salida.append("\n### " + l.lstrip("📍 ").strip() + "\n")
            elif l.startswith("📌"):
                salida.append("- " + l.lstrip("📌 ").strip())
            else:
                salida.append(l)
        if salida:
            parrafos.append("\n".join(salida).strip())
    # la pregunta final es la invitación a conversar: va aparte
    if parrafos and parrafos[-1].endswith("?") and "\n" not in parrafos[-1] and len(parrafos[-1]) < 220:
        pregunta = parrafos.pop()
    texto = "\n\n".join(parrafos)
    texto = re.sub(r"\n{3,}", "\n\n", texto)
    # emojis sueltos al final de una frase (🇧🇷, 📂…) sobran en la página
    texto = re.sub(r"\s*[\U0001F000-\U0001FAFF\u2600-\u27BF]+(?:\uFE0F)?", "", texto)
    return texto.strip(), pregunta


def fuentes(md):
    lista = []
    for l in seccion(md, "Fuentes").split("\n"):
        l = l.strip()
        if not l.startswith("- "):
            continue
        l = l[2:]
        urls = re.findall(r"https?://\S+", l)
        texto = re.sub(r"\s*https?://\S+", "", l).strip().rstrip(".").strip()
        if "no la usé" in texto or "no las usé" in texto:
            continue
        lista.append({"texto": texto, "url": urls[0].rstrip(").,") if urls else None})
    return lista


def creditos(md):
    """Los créditos de las fotos: la tabla (autor, licencia, lugar, fecha, enlace) o la lista."""
    m = re.search(r"^## (?:Créditos|Fotos? \(|Foto)[^\n]*\n(.*?)(?=^## |\Z)", md, re.S | re.M)
    if not m:
        return []
    filas, lista = [], []
    for l in m.group(1).split("\n"):
        l = l.strip()
        if l.startswith("|") and not re.match(r"^\|\s*-", l):
            celdas = [c.strip() for c in l.strip("|").split("|")]
            if celdas and celdas[0].lower().startswith("lámina"):
                continue
            filas.append(celdas)
        elif l.startswith("- "):
            urls = re.findall(r"https?://\S+", l)
            lista.append({"texto": re.sub(r"\s*https?://\S+", "", l[2:]).strip(" .·—-"), "url": urls[0] if urls else None})
    for c in filas:
        urls = re.findall(r"https?://\S+", " ".join(c))
        partes = [x for x in c[1:] if x and x != "—" and not x.startswith("http")]
        lista.append({"texto": " · ".join(partes), "url": urls[0] if urls else None})
    return lista


def fecha_de(meta, carpeta):
    base = dt.date.fromisoformat(carpeta[:10])
    m = re.search(r"\b(\d{1,2}) (ENE|FEB|MAR|ABR|MAY|JUN|JUL|AGO|SEP|OCT|NOV|DIC)\b", meta or "")
    if m:
        return dt.date(base.year, MESES[m.group(2)], int(m.group(1)))
    return base


def lugar_de(meta, linea):
    partes = [p.strip() for p in (meta or "").split("·")]
    partes = [p for p in partes if p and not re.search(r"\d", p)]
    region = "colombia"
    if partes and partes[0] in ("AMÉRICA LATINA", "MUNDO", "EL MUNDO"):
        region = "america-latina" if partes[0] == "AMÉRICA LATINA" else "mundo"
        partes = partes[1:]
    if partes and partes[0] == "ESPECIAL":
        partes = partes[1:]
    lugar = nombre_propio(partes[0]) if partes else None
    if region == "mundo" and lugar in (None, "El Mundo"):
        lugar = None
    return (region if linea == "al-aire" else None), lugar


def titulo_limpio(t):
    return re.sub(r"\s+", " ", (t or "").replace("\n", " ")).strip()


def revelar(ruta_foto, destino, semilla):
    """La foto limpia, revelada con la película de las láminas (misma colorización y grano según calidad)."""
    im = Image.open(ruta_foto).convert("RGB")
    esc = min(1.0, LADO / max(im.size))
    if esc < 1:
        im = im.resize((round(im.width * esc), round(im.height * esc)), Image.LANCZOS)
    im = dn.colorizar(im, None)
    grano = max(0.0, min(1.0, min(im.size) / 1600 - 0.35))
    im = dn.pelicula(im, semilla, grano=grano).convert("RGB")
    im.save(destino, "JPEG", quality=88, progressive=True, optimize=True)


def escribir(dest, campos, cuerpo):
    lineas = ["---"]
    for k, v in campos.items():
        if v is None or v == [] or v == "":
            continue
        if isinstance(v, (dict, list)):
            lineas.append(f"{k}: {json.dumps(v, ensure_ascii=False)}")
        elif isinstance(v, bool):
            lineas.append(f"{k}: {'true' if v else 'false'}")
        elif isinstance(v, dt.date):
            lineas.append(f"{k}: {v.isoformat()}")
        else:
            lineas.append(f"{k}: {yaml_str(str(v))}")
    lineas.append("---\n")
    (dest / "index.md").write_text("\n".join(lineas) + cuerpo.strip() + "\n", encoding="utf-8")


def copiar_laminas(carpeta, prefijo, dest):
    (dest / "laminas").mkdir(exist_ok=True)
    rutas = []
    for f in sorted(carpeta.glob(f"{prefijo}-[0-9][0-9].*")):
        if f.suffix.lower() not in (".jpg", ".jpeg", ".png"):
            continue
        sal = dest / "laminas" / f"{f.stem[-2:]}.jpg"
        im = Image.open(f).convert("RGB")
        im.save(sal, "JPEG", quality=90, progressive=True, optimize=True)
        rutas.append(f"./laminas/{sal.name}")
    return rutas


def importar_pieza(ruta_json, hasta, forzar):
    cfg = json.loads(ruta_json.read_text(encoding="utf-8"))
    carpeta = Path(cfg["salida"]) if Path(cfg["salida"]).is_absolute() else ruta_json.parent / cfg["salida"]
    if carpeta.name in ("v2", "vertical 4x5"):
        carpeta_desc = carpeta.parent
    else:
        carpeta_desc = carpeta
    descs = sorted(carpeta.glob("*descripcion.md")) or sorted(carpeta_desc.glob("*descripcion.md"))
    if not descs:
        print("  sin descripción:", ruta_json.name)
        return
    md = descs[0].read_text(encoding="utf-8")
    linea = LINEAS.get(cfg.get("seccion"), "al-aire")
    portada = cfg["laminas"][0]
    titulo = titulo_limpio(portada.get("titulo")) or re.sub(r"\s·.*$", "", md.split("\n")[0].lstrip("# ")).strip()
    serie = cfg.get("serie")
    if serie:
        titulo = titulo_limpio(portada.get("titulo")) or titulo
    fecha = fecha_de(cfg.get("meta"), carpeta_desc.name)
    if fecha > hasta:
        return
    s = slug(titulo.replace("*", ""))
    dest = DESTINO / s
    if dest.exists() and s not in forzar:
        return
    dest.mkdir(parents=True, exist_ok=True)
    region, lugar = lugar_de(cfg.get("meta"), linea)
    ig = seccion(md, "Instagram")
    cuerpo, pregunta = cuerpo_instagram(ig)
    bajada = titulo_limpio(portada.get("bajada"))
    if not bajada:
        primero, _, resto = cuerpo.partition("\n\n")
        bajada, cuerpo = primero, resto

    # portada: la foto limpia revelada; si no hay foto (o es video), la primera lámina hace de portada
    foto = portada.get("foto")
    ruta_foto = None
    if foto:
        p = Path(foto)
        for cand in (p, carpeta / p, ruta_json.parent / p, carpeta / "fuentes" / p.name):
            if cand.exists() and cand.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp"):
                ruta_foto = cand
                break
    laminas = copiar_laminas(carpeta, cfg["prefijo"], dest)
    if ruta_foto:
        revelar(ruta_foto, dest / "portada.jpg", zlib.crc32(s.encode()) % 100000)
        img, credito_portada = "./portada.jpg", re.sub(r"^Fotos?:\s*", "", portada.get("credito") or "")
    else:
        img, credito_portada = (laminas[0] if laminas else None), None
    foco = portada.get("foco")
    campos = {
        "titulo": titulo,
        "bajada": bajada,
        "linea": linea,
        "region": region,
        "lugar": lugar,
        "fecha": fecha,
        "formato": "breve" if len(cfg["laminas"]) <= 2 else "carrusel",
        "serie": {"nombre": serie["nombre"], "parte": serie["parte"], "de": serie["de"]} if serie else None,
        "portada": img,
        "portadaCredito": credito_portada,
        "foco": f"{round(foco[0] * 100)}% {round(foco[1] * 100)}%" if foco else None,
        "laminas": laminas,
        "pregunta": pregunta,
        "fuentes": fuentes(md),
        "creditos": creditos(md),
    }
    escribir(dest, campos, cuerpo)
    print(f"  {linea:16} {fecha}  {s}")


def importar_expediente(n, hasta, forzar):
    carpeta = NOTICIAS / "Expediente" / f"N{n}"
    cfg = json.loads((EXPEDIENTE / f"ediciones/n{n}/n{n}.json").read_text(encoding="utf-8"))
    m = re.search(r"(\d{1,2}) de (\w+) de (\d{4})", cfg["fecha"])
    meses = "enero febrero marzo abril mayo junio julio agosto septiembre octubre noviembre diciembre".split()
    fecha = dt.date(int(m.group(3)), meses.index(m.group(2).lower()) + 1, int(m.group(1)))
    if fecha > hasta:
        return
    s = f"expediente-de-la-espriella-n-{n}"
    dest = DESTINO / s
    if dest.exists() and s not in forzar:
        return
    dest.mkdir(parents=True, exist_ok=True)
    md = (carpeta / "descripcion.md").read_text(encoding="utf-8")
    cuerpo, pregunta = cuerpo_instagram(seccion(md, "Instagram"))
    primero, _, resto = cuerpo.partition("\n\n")
    portada = cfg["laminas"][0]
    (dest / "laminas").mkdir(exist_ok=True)
    laminas = []
    for f in sorted(carpeta.glob("lamina-[0-9][0-9].png")):
        Image.open(f).convert("RGB").save(dest / "laminas" / f"{f.stem[-2:]}.jpg", "JPEG", quality=90, progressive=True, optimize=True)
        laminas.append(f"./laminas/{f.stem[-2:]}.jpg")
    revelar(EXPEDIENTE / portada["foto"], dest / "portada.jpg", n)
    credito = re.sub(r"^.*Foto:\s*", "", portada.get("fuentes", ""))
    foco = portada.get("foco")
    campos = {
        "titulo": f"Expediente De la Espriella N.º {n}",
        "bajada": re.sub(r"\*\*(.+?)\*\*", r"\1", portada.get("gancho") or primero),
        "linea": "expediente",
        "fecha": fecha,
        "formato": "carrusel",
        "periodo": cfg.get("periodo"),
        "numero": n,
        "portada": "./portada.jpg",
        "portadaCredito": credito,
        "foco": f"{round(foco[0] * 100)}% {round(foco[1] * 100)}%" if foco else None,
        "laminas": laminas,
        "firma": "Andrés Tafur Villarreal",
        "firmaEnlace": "/autores/andres-tafur-villarreal",
        "coproduccion": "RED Quynza",
        "pregunta": pregunta,
    }
    escribir(dest, campos, (primero + "\n\n" + resto) if portada.get("gancho") else resto)
    print(f"  expediente       {fecha}  {s}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--hasta", default=dt.date.today().isoformat())
    ap.add_argument("--forzar", nargs="*", default=[])
    a = ap.parse_args()
    hasta = dt.date.fromisoformat(a.hasta)
    DESTINO.mkdir(parents=True, exist_ok=True)
    for f in sorted((KIT / "noticias").glob("*.json")):
        if f.name not in FUERA:
            importar_pieza(f, hasta, set(a.forzar))
    for f in sorted(EXPEDIENTE.glob("ediciones/n*/n*.json")):
        importar_expediente(int(f.stem[1:]), hasta, set(a.forzar))


if __name__ == "__main__":
    main()
