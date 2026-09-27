# Dial — sitio web

Sitio comercial de Dial (productora audiovisual). Astro estático, pensado para Cloudflare Pages.

## Trabajar en local

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # genera dist/
```

## Editar contenido (sin tocar componentes)

| Qué | Dónde |
|---|---|
| Correo, WhatsApp, redes, tagline | `src/data/sitio.json` |
| Capacidades, servicios sueltos, criterios, proceso | `src/data/capacidades.json` |
| Paquetes de servicio | `src/content/servicios/*.md` |
| Casos por encargo (Impacto, Encuentros, Celebraciones) | `src/content/casos/<nombre-del-caso>/index.md` |
| Obra propia (debates, documentales, clips) | `src/content/medio/*.md` |
| Muestras de música y sonido | `src/content/muestras/*.md` |
| Equipo | `src/content/equipo/*.json` (la foto va junto al archivo) |

**Nuevo caso:** copia `src/content/casos/_plantilla-impacto/`, cambia el nombre de la carpeta (será la URL),
llena los datos, pon las fotos en la misma carpeta y cambia `borrador: true` a `false`.
El campo `vitrina` decide en qué portafolio aparece.

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
