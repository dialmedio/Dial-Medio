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
 *   WOMPI_INTEGRITY_SECRET  secreto de integridad de Wompi (prod_integrity_…), para /apoya
 * Variable (wrangler.jsonc → vars): WOMPI_PUBLIC_KEY (pub_prod_… o pub_test_…).
 * Sin las dos, /apoya solo muestra la llave Bre-B / Nequi.
 */

interface Env {
  ASSETS: { fetch: (req: Request) => Promise<Response> };
  RESEND_API_KEY?: string;
  CONTACTO_DESTINO?: string;
  CONTACTO_REMITENTE?: string;
  TURNSTILE_SECRET?: string;
  WOMPI_PUBLIC_KEY?: string;
  WOMPI_INTEGRITY_SECRET?: string;
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

/**
 * Aportes con Wompi (Web Checkout, pago único). /apoya pide la firma aquí porque el secreto
 * de integridad no puede ir al navegador. Las referencias empiezan por DIAL- para
 * distinguirlas en el panel de Wompi si el comercio es compartido.
 */
const APOYO_MIN = 5000;
const APOYO_MAX = 10_000_000;

async function sha256(s: string): Promise<string> {
  const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(h)].map((x) => x.toString(16).padStart(2, '0')).join('');
}

async function apoyo(request: Request, env: Env, url: URL): Promise<Response> {
  const ruta = url.pathname.replace(/\/$/, '');
  const activo = Boolean(env.WOMPI_PUBLIC_KEY && env.WOMPI_INTEGRITY_SECRET);
  const sandbox = String(env.WOMPI_PUBLIC_KEY ?? '').startsWith('pub_test_');
  const api = sandbox ? 'https://sandbox.wompi.co/v1' : 'https://production.wompi.co/v1';

  if (ruta === '/api/apoyo/config' && request.method === 'GET') {
    return new Response(JSON.stringify({ activo, sandbox }), {
      headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
    });
  }

  if (ruta === '/api/apoyo' && request.method === 'POST') {
    if (!activo) return json({ ok: false, error: 'Los aportes en línea aún no están activos.' }, 503);
    const b = (await request.json().catch(() => ({}))) as { monto?: unknown };
    const monto = Math.round(Number(b.monto));
    if (!Number.isFinite(monto) || monto < APOYO_MIN || monto > APOYO_MAX) {
      return json({ ok: false, error: `El aporte debe ser de al menos $${APOYO_MIN.toLocaleString('es-CO')}.` }, 400);
    }
    const hoy = new Date(Date.now() - 5 * 3600 * 1000).toISOString().slice(0, 10).replace(/-/g, '');
    const referencia = `DIAL-${hoy}-${crypto.randomUUID().slice(0, 8)}`;
    const centavos = monto * 100;
    const firma = await sha256(`${referencia}${centavos}COP${env.WOMPI_INTEGRITY_SECRET}`);
    const q = new URLSearchParams({
      'public-key': env.WOMPI_PUBLIC_KEY!,
      currency: 'COP',
      'amount-in-cents': String(centavos),
      reference: referencia,
      'signature:integrity': firma,
      // Wompi bloquea (403) los regresos a http://localhost: en pruebas se vuelve al sitio real.
      'redirect-url': `${url.protocol === 'https:' ? url.origin : 'https://dialmedio.org'}/apoya/gracias`,
    });
    // Wompi documenta el parámetro con los dos puntos tal cual (signature:integrity).
    return json({ ok: true, url: `https://checkout.wompi.co/p/?${q.toString().replace('signature%3Aintegrity', 'signature:integrity')}` });
  }

  if (ruta === '/api/apoyo/estado' && request.method === 'GET') {
    const id = url.searchParams.get('id') ?? '';
    if (!/^[\w-]{6,64}$/.test(id)) return json({ ok: false }, 400);
    const r = await fetch(`${api}/transactions/${id}`);
    if (!r.ok) return json({ ok: false }, 404);
    const t = ((await r.json()) as { data?: { reference?: string; status?: string; amount_in_cents?: number } }).data;
    if (!t?.reference?.startsWith('DIAL-')) return json({ ok: false }, 404);
    return json({ ok: true, estado: t.status, monto: Math.round((t.amount_in_cents ?? 0) / 100) });
  }

  return json({ ok: false, error: 'No encontrado' }, 404);
}

/**
 * Direcciones viejas (nov 2026): /medio se repartió en secciones. Los enlaces que ya circulan siguen funcionando.
 * debate-* → /laboratorio, podcast-* → /podcast, el resto (documentales) → /documentales.
 */
function redireccion(ruta: string): string | null {
  // Nov 18 2026: Dial pasa a ser la productora. El estudio es ahora la portada y las secciones del medio se reúnen en /trabajo.
  const r = ruta.replace(/\/$/, '') || '/';
  const fijas: Record<string, string> = {
    '/estudio': '/',
    '/estudio/como-trabajamos': '/nosotros',
    '/impacto': '/servicios#documental',
    '/impacto/medicion': '/investigacion#medir',
    '/encuentros': '/servicios#eventos',
    '/encuentros/celebraciones': '/servicios#eventos',
    '/documentales': '/trabajo#documental',
    '/laboratorio': '/trabajo#documental',
    '/podcast': '/trabajo#documental',
  };
  if (fijas[r]) return fijas[r];
  if (r.startsWith('/impacto/') || r.startsWith('/encuentros/')) return '/servicios';
  if (ruta === '/medio' || ruta === '/medio/') return '/';
  if (ruta === '/especiales' || ruta.startsWith('/especiales/')) return '/noticias'; // la sección se quitó (1 nov 2026)
  const m = ruta.match(/^\/medio\/([^/]+)\/?$/);
  if (!m) return null;
  const id = m[1];
  if (id.startsWith('debate-')) return `/laboratorio/${id}`;
  if (id.startsWith('podcast-')) return `/podcast/${id}`;
  if (id.startsWith('clip-')) return '/trabajo#documental';
  return `/documentales/${id}`;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    const nueva = redireccion(url.pathname);
    if (nueva) return Response.redirect(new URL(nueva, url).toString(), 301);

    if (url.hostname.startsWith('www.')) {
      url.hostname = url.hostname.slice(4);
      return Response.redirect(url.toString(), 301);
    }

    if (url.pathname.startsWith('/api/apoyo')) {
      try {
        return await apoyo(request, env, url);
      } catch (e) {
        console.error('apoyo', url.pathname, e);
        return json({ ok: false, error: 'No pudimos conectar con Wompi.' }, 502);
      }
    }

    if (url.pathname === '/api/contacto') {
      if (request.method !== 'POST') return json({ ok: false, error: 'Método no permitido.' }, 405);
      return contacto(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};
