"""Sube a dialmedio.org las noticias ya publicadas en redes y despliega el sitio, sin intervención.

Lo corre el Programador de tareas de Windows día de por medio (tarea «Dial - actualizar sitio»). Trabaja en su
propia copia del repo (D:/Claude Code/dial-web-auto, un worktree de git), así no toca lo que otro chat tenga a
medias en dial-web ni su `dist`:

  1. pone la copia al día con origin/main
  2. importa las piezas hasta AYER (lo de hoy quizá no se ha publicado) con importar_noticias.py
  3. si no hay piezas nuevas, termina sin desplegar
  4. tarjetas para compartir (generar-imagenes.mjs), commit solo de lo nuevo y push a main
  5. build completo + pagefind, revisa dist y despliega con wrangler (Workers Builds no se dispara con los push)
  6. comprueba que cada pieza nueva responda en dialmedio.org y deja el registro en _Kit

Para que una pieza no suba nunca, agregar su JSON a FUERA en importar_noticias.py.

Uso:  python -X utf8 scripts/actualizar_sitio.py [--hasta AAAA-MM-DD] [--sin-desplegar]
"""
import argparse
import datetime as dt
import os
import re
import shutil
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

PRINCIPAL = Path("D:/Claude Code/dial-web")
COPIA = Path("D:/Claude Code/dial-web-auto")
REGISTRO = Path("D:/AA Dialmedio/Noticias/_Kit/Actualización del sitio.log")
CANDADO = COPIA.parent / "dial-web-auto.lock"
SITIO = "https://dialmedio.org"
FIRMA = "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"

lineas_registro = []


def anotar(texto):
    linea = f"{dt.datetime.now():%Y-%m-%d %H:%M}  {texto}"
    print(linea, flush=True)
    lineas_registro.append(linea)


def correr(cmd, cwd=COPIA, env=None, revisar=True):
    r = subprocess.run(cmd, cwd=cwd, env=env, shell=isinstance(cmd, str), capture_output=True,
                       text=True, encoding="utf-8", errors="replace")
    if revisar and r.returncode:
        raise RuntimeError(f"{cmd if isinstance(cmd, str) else ' '.join(map(str, cmd))} falló:\n"
                           f"{(r.stdout + r.stderr)[-1500:]}")
    return r


def git(*args, cwd=COPIA, revisar=True):
    return correr(["git", *args], cwd=cwd, revisar=revisar)


def preparar_copia():
    git("fetch", "-q", "origin", cwd=PRINCIPAL)
    if not (COPIA / ".git").exists():
        git("worktree", "add", "--detach", str(COPIA), "origin/main", cwd=PRINCIPAL)
    git("fetch", "-q", "origin")
    git("reset", "-q", "--hard", "origin/main")
    git("clean", "-q", "-fd", "src/content/noticias", "public/og")
    nm = COPIA / "node_modules"
    if not nm.exists():  # junction a los paquetes de dial-web (no hace falta instalar dos veces)
        correr(f'mklink /J "{nm}" "{PRINCIPAL / "node_modules"}"', cwd=COPIA)
    # la identidad (Dial) y el credential helper de dialmedio vienen del .git/config que comparte el worktree


def piezas_nuevas():
    salida = git("status", "--porcelain", "--untracked-files=normal", "src/content/noticias").stdout
    return sorted({Path(l[3:].strip().strip('"')).parts[3] for l in salida.splitlines() if l.startswith("??")})


def entorno_cloudflare():
    env = dict(os.environ)
    for l in (PRINCIPAL / ".env").read_text(encoding="utf-8").splitlines():
        m = re.match(r"^\s*([A-Z_]+)\s*=\s*(.*?)\s*$", l)
        if m:
            env[m.group(1)] = m.group(2).strip('"').strip("'")
    return env


def desplegar():
    shutil.rmtree(COPIA / "dist", ignore_errors=True)
    correr("npm run build")
    for f in ("index.html", "pagefind/pagefind.js"):
        if not (COPIA / "dist" / f).exists():
            raise RuntimeError(f"el build quedó incompleto: falta dist/{f}")
    conf = (COPIA / "wrangler.jsonc").read_text(encoding="utf-8")
    # sin la sección build: wrangler en Windows se cae corriendo `npm run build` por su cuenta
    (COPIA / "wrangler.deploy.jsonc").write_text(re.sub(r'\s*"build":\s*\{[^}]*\},', "", conf), encoding="utf-8")
    env = entorno_cloudflare()
    try:
        for intento in range(1, 4):  # a veces no resuelve api.cloudflare.com al primer intento
            r = correr("npx wrangler deploy --config wrangler.deploy.jsonc", env=env, revisar=False)
            if r.returncode == 0 and "Current Version ID" in r.stdout:
                return re.search(r"Current Version ID: (\S+)", r.stdout).group(1)
            anotar(f"wrangler falló (intento {intento}); reintento en 30 s")
            time.sleep(30)
        raise RuntimeError("wrangler no pudo desplegar:\n" + (r.stdout + r.stderr)[-1500:])
    finally:
        (COPIA / "wrangler.deploy.jsonc").unlink(missing_ok=True)


def responde(ruta):
    for _ in range(3):
        try:
            with urllib.request.urlopen(f"{SITIO}{ruta}?v={int(time.time())}", timeout=30) as r:
                return r.status
        except Exception as e:
            codigo = getattr(e, "code", 0)
        time.sleep(5)
    return codigo


def ruta_de(slug):
    md = (COPIA / "src/content/noticias" / slug / "index.md").read_text(encoding="utf-8")
    return f"/noticias/{re.search(r'^linea:\s*\"?([a-z-]+)', md, re.M).group(1)}/{slug}"


def avisar(titulo, texto):
    """Notificación de Windows, para que Martín sepa qué se subió."""
    ps = (
        "[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] > $null;"
        "$x = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02);"
        f"$t = $x.GetElementsByTagName('text'); $t.Item(0).AppendChild($x.CreateTextNode('{titulo}')) > $null;"
        f"$t.Item(1).AppendChild($x.CreateTextNode('{texto.replace(chr(39), '')}')) > $null;"
        "[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('Dial').Show([Windows.UI.Notifications.ToastNotification]::new($x))"
    )
    correr(["powershell", "-NoProfile", "-Command", ps], cwd=PRINCIPAL, revisar=False)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--hasta", default=(dt.date.today() - dt.timedelta(days=1)).isoformat())
    ap.add_argument("--sin-desplegar", action="store_true", help="importa y muestra qué subiría, sin commit ni deploy")
    a = ap.parse_args()

    preparar_copia()
    correr([sys.executable, "-X", "utf8", "scripts/importar_noticias.py", "--hasta", a.hasta])
    nuevas = piezas_nuevas()
    if not nuevas:
        anotar(f"sin piezas nuevas hasta el {a.hasta}; no se despliega")
        return
    anotar(f"{len(nuevas)} pieza(s) nueva(s): " + ", ".join(nuevas))
    if a.sin_desplegar:
        anotar("prueba (--sin-desplegar): no se hizo commit ni deploy")
        return

    correr(["node", "scripts/generar-imagenes.mjs"])
    git("add", *(f"src/content/noticias/{s}" for s in nuevas))
    for s in nuevas:
        if (COPIA / f"public/og/piezas/{s}.jpg").exists():
            git("add", f"public/og/piezas/{s}.jpg")
    git("commit", "-q", "-m", f"Noticias nuevas en el sitio ({len(nuevas)})\n\n" + "\n".join(f"- {s}" for s in nuevas)
        + f"\n\nSubidas por scripts/actualizar_sitio.py.\n\n{FIRMA}")
    for intento in range(2):  # si otro chat empujó mientras tanto, se monta encima y se reintenta
        if git("push", "-q", "origin", "HEAD:main", revisar=False).returncode == 0:
            break
        git("pull", "-q", "--rebase", "origin", "main")
    else:
        raise RuntimeError("no se pudo hacer push a main")
    anotar("commit " + git("rev-parse", "--short", "HEAD").stdout.strip() + " en main")

    version = desplegar()
    anotar(f"desplegado (versión {version})")
    malas = [(s, c) for s in nuevas if (c := responde(ruta_de(s))) != 200]
    if malas:
        anotar("no responden: " + ", ".join(f"{s} ({c})" for s, c in malas))
    # dial-web queda al día si se puede sin pisar nada (si hay cambios a medias que chocan, no hace nada)
    git("merge", "-q", "--ff-only", "origin/main", cwd=PRINCIPAL, revisar=False)
    avisar("Dial: sitio actualizado", f"{len(nuevas)} noticia(s) nuevas en dialmedio.org" + (" (revisar el registro)" if malas else ""))


def candado_vivo():
    """True si el candado es de una actualización que sigue corriendo (no de una que se cortó al cerrar la ventana)."""
    if not CANDADO.exists() or time.time() - CANDADO.stat().st_mtime > 3 * 3600:
        return False
    try:
        pid = int(CANDADO.read_text().strip())
    except ValueError:
        return False
    r = subprocess.run(["tasklist", "/FI", f"PID eq {pid}", "/NH"], capture_output=True, text=True, errors="replace")
    return str(pid) in r.stdout


if __name__ == "__main__":
    if candado_vivo():
        print("ya hay una actualización corriendo")
        sys.exit(0)
    CANDADO.write_text(str(os.getpid()))
    try:
        main()
    except Exception as e:
        anotar("ERROR: " + str(e))
        avisar("Dial: falló la actualización del sitio", str(e).splitlines()[0][:180])
        sys.exit(1)
    finally:
        CANDADO.unlink(missing_ok=True)
        if lineas_registro:
            with REGISTRO.open("a", encoding="utf-8") as f:
                f.write("\n".join(lineas_registro) + "\n")
