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

## Formulario de contacto

`functions/api/contacto.ts` es una Pages Function que envía el formulario con [Resend](https://resend.com).
Variables en Cloudflare Pages → Settings → Variables and Secrets:

- `RESEND_API_KEY`
- `CONTACTO_DESTINO` (p. ej. dialmediocol@gmail.com)
- `CONTACTO_REMITENTE` (un remitente del dominio verificado en Resend)
- `TURNSTILE_SECRET` (opcional, antispam) + poner la clave pública en `data-sitekey` de `src/pages/contacto.astro`

Mientras no esté configurado, el formulario ofrece enviar la solicitud por correo con un clic.

## Pendiente al tener dominio

- Cambiar `SITE` en `astro.config.mjs`.
- Regenerar la imagen para redes si cambia el texto: `node scripts/generar-imagenes.mjs`.
