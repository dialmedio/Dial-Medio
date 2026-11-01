# Dial — sitio web

Sitio de Dial, medio independiente (noticias, opinión, podcast, documentales, laboratorio), y de Dial Estudio, su productora. Astro estático en Cloudflare (Workers).

## Trabajar en local

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # genera dist/ y el índice del buscador (Pagefind)
```

## Editar contenido (sin tocar componentes)

| Qué | Dónde |
|---|---|
| Correo, WhatsApp, redes, tagline | `src/data/sitio.json` |
| Capacidades, servicios sueltos, criterios, proceso | `src/data/capacidades.json` |
| Paquetes de servicio | `src/content/servicios/*.md` |
| Casos por encargo (Impacto, Encuentros, Celebraciones) | `src/content/casos/<nombre-del-caso>/index.md` |
| Noticias (Al Aire, Termómetro, Expediente, Arte y memoria…) | `src/content/noticias/<pieza>/index.md` + `portada.jpg` + `laminas/` |
| Columnas de opinión | `src/content/opinion/*.md` (copiar `_plantilla.md`) |
| Autores (columnistas, invitados) | `src/content/autores/*.json` + retrato en trama `.png` |
| Ensayos fotográficos | `src/content/fotografia/<ensayo>/index.md` (la sección sale en el menú con el primero) |
| Presentación de cada especial (serie) | `presentaciones` en `src/lib/medio.ts` |
| Videos: debates y clips (Laboratorio), podcast, documentales | `src/content/medio/*.md` (`formato` decide la sección) |
| Muestras de música y sonido | `src/content/muestras/*.md` |
| Equipo | `src/content/equipo/*.json` (la foto va junto al archivo) |

**Nuevo caso:** copia `src/content/casos/_plantilla-impacto/`, cambia el nombre de la carpeta (será la URL),
llena los datos, pon las fotos en la misma carpeta y cambia `borrador: true` a `false`.
El campo `vitrina` decide en qué portafolio aparece.

**Noticias:** las piezas ya producidas se importan con su texto, fuentes, créditos, láminas y la foto de portada
revelada con la película de las láminas:

```bash
python -X utf8 scripts/importar_noticias.py              # importa lo que falte, hasta hoy
python -X utf8 scripts/importar_noticias.py --forzar <slug>   # rehace una (pisa los cambios a mano)
```

Después se puede corregir el `index.md` a mano (`destacado: true` la pone de apertura en la portada,
`borrador: true` la esconde, `correcciones:` agrega la fe de erratas al final).

**Nueva columna:** copia `src/content/opinion/_plantilla.md` con un nombre corto, llena los datos y quita `borrador`.
El acento del titular va entre asteriscos. En `npm run dev`, reinicia el servidor la primera vez (la colección estaba vacía).

**Nuevo autor:** un `.json` en `src/content/autores/` y su retrato en trama de periódico, sin fondo:

```bash
python -X utf8 scripts/recorte_trama.py <foto.jpg> src/content/autores/<nombre>.png --foco 0.5 0.3 --zoom 1.7
```

**Videos:** solo el ID de YouTube (lo que va después de `v=`). Para Vimeo: `plataforma: vimeo` y una `miniatura`.

## Publicación

El sitio es un Worker de Cloudflare llamado `dial-medio` (configuración en `wrangler.jsonc`),
conectado al repositorio `dialmedio/Dial-Medio`. Cada push a `main` lo compila y publica solo (Workers Builds).
También se puede publicar desde aquí con `npm run deploy` (usa la llave de `.env`, que no se sube a GitHub).

Dominio: https://dialmedio.org (www redirige al dominio principal).

## Formulario de contacto

`worker/index.ts` atiende `POST /api/contacto` y envía la solicitud con [Resend](https://resend.com).
Secretos del Worker (Cloudflare → Workers → dial-medio → Settings → Variables and Secrets, o `npx wrangler secret put NOMBRE`):

- `RESEND_API_KEY`
- `CONTACTO_DESTINO` (p. ej. dialmediocol@gmail.com)
- `CONTACTO_REMITENTE` (p. ej. `Sitio Dial <sitio@dialmedio.org>`, con el dominio verificado en Resend)
- `TURNSTILE_SECRET` (opcional, antispam) + poner la clave pública en `data-sitekey` de `src/pages/contacto.astro`

Mientras no esté configurado, el formulario ofrece enviar la solicitud por correo con un clic.

Si cambia el texto de la imagen para redes: `node scripts/generar-imagenes.mjs`.

## Marca (manual v3)

El manual vive en https://dialmedio.org/marca (sin indexar) y en PDF.

- Tipografías: Instrument Sans (titulares y texto), Instrument Serif (acentos en cursiva), IBM Plex Mono (datos).
- Colores: carbón #17130F, papel #F4EEE5, hueso #E9DFCF, terracota #C0442A, brasa #E58A3A. Tokens en `src/styles/global.css`.
- Logotipo y símbolo: `node scripts/generar-marca.mjs` regenera `src/data/logotipo.json` y los SVG de `public/marca/`.
- Imágenes para compartir e íconos: `node scripts/generar-imagenes.mjs` (usa Chrome).
- PDF del manual: con `npx astro preview --port 4350` corriendo, `node scripts/exportar-manual.mjs "ruta/salida.pdf"`.
