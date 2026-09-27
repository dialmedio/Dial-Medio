/**
 * Worker de Dial: sirve el sitio estático (carpeta dist/) y atiende el formulario de cotización.
 *
 * - www.dialmedio.org redirige a dialmedio.org.
 * - POST /api/contacto envía la solicitud por correo con Resend.
 * - Todo lo demás lo sirven los archivos estáticos.
 *
 * Secretos (Cloudflare > Workers > dial-medio > Settings > Variables and Secrets,
 * o `npx wrangler secret put NOMBRE`):
 *   RESEND_API_KEY     clave de Resend
 *   CONTACTO_DESTINO   correo que recibe las solicitudes (p. ej. dialmediocol@gmail.com)
 *   CONTACTO_REMITENTE remitente verificado en Resend (p. ej. "Sitio Dial <sitio@dialmedio.org>")
 *   TURNSTILE_SECRET   (opcional) clave secreta de Cloudflare Turnstile
 */

interface Env {
  ASSETS: { fetch: (req: Request) => Promise<Response> };
  RESEND_API_KEY?: string;
  CONTACTO_DESTINO?: string;
  CONTACTO_REMITENTE?: string;
  TURNSTILE_SECRET?: string;
}

const CAMPOS = ['linea', 'servicio', 'nombre', 'organizacion', 'correo', 'telefono', 'fecha', 'presupuesto', 'mensaje'] as const;
const ETIQUETAS: Record<string, string> = {
  linea: 'Línea',
  servicio: 'Tipo de proyecto',
  nombre: 'Nombre',
  organizacion: 'Organización',
  correo: 'Correo',
  telefono: 'WhatsApp / teléfono',
  fecha: 'Fecha aproximada',
  presupuesto: 'Presupuesto',
  mensaje: 'Mensaje',
};

const json = (cuerpo: unknown, status = 200) =>
  new Response(JSON.stringify(cuerpo), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });

const escapar = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

async function contacto(request: Request, env: Env): Promise<Response> {
  const form = await request.formData();

  // Trampa para bots: un humano nunca llena este campo.
  if (String(form.get('sitio_web') ?? '').trim()) return json({ ok: true });

  const datos = Object.fromEntries(CAMPOS.map((c) => [c, String(form.get(c) ?? '').trim().slice(0, 5000)]));
  if (!datos.nombre || !datos.mensaje || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.correo)) {
    return json({ ok: false, error: 'Faltan datos obligatorios.' }, 400);
  }

  if (env.TURNSTILE_SECRET) {
    const verif = (await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: new URLSearchParams({
        secret: env.TURNSTILE_SECRET,
        response: String(form.get('cf-turnstile-response') ?? ''),
        remoteip: request.headers.get('CF-Connecting-IP') ?? '',
      }),
    }).then((r) => r.json())) as { success: boolean };
    if (!verif.success) return json({ ok: false, error: 'Verificación fallida.' }, 403);
  }

  if (!env.RESEND_API_KEY || !env.CONTACTO_DESTINO || !env.CONTACTO_REMITENTE) {
    return json({ ok: false, error: 'El envío de correo aún no está configurado.' }, 503);
  }

  const llenos = CAMPOS.filter((c) => datos[c]);
  const filas = llenos
    .map(
      (c) =>
        `<tr><td style="padding:6px 12px 6px 0;color:#5a4f46;font:12px monospace;text-transform:uppercase;vertical-align:top">${ETIQUETAS[c]}</td><td style="padding:6px 0;font:15px Georgia,serif;white-space:pre-wrap">${escapar(datos[c])}</td></tr>`,
    )
    .join('');

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.CONTACTO_REMITENTE,
      to: [env.CONTACTO_DESTINO],
      reply_to: datos.correo,
      subject: `Cotización · ${datos.linea || 'sitio'} · ${datos.nombre}${datos.organizacion ? ' (' + datos.organizacion + ')' : ''}`,
      html: `<h2 style="font-family:Georgia,serif">Nueva solicitud desde el sitio de Dial</h2><table>${filas}</table>`,
      text: llenos.map((c) => `${ETIQUETAS[c]}: ${datos[c]}`).join('\n'),
    }),
  });

  if (!r.ok) return json({ ok: false, error: 'No se pudo enviar el correo.' }, 502);
  return json({ ok: true });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.hostname.startsWith('www.')) {
      url.hostname = url.hostname.slice(4);
      return Response.redirect(url.toString(), 301);
    }

    if (url.pathname === '/api/contacto') {
      if (request.method !== 'POST') return json({ ok: false, error: 'Método no permitido.' }, 405);
      return contacto(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};
