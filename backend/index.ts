import { router, error } from '@appdeploy/sdk';

const SUPABASE_REDIRECT_URL = 'https://irkzwaprydcvmvikglfm.supabase.co/functions/v1/qr-redirect';

async function resolveQr({ params, event }: { params: Record<string, string>; event: any }) {
  const slug = params.slug ?? '';
  if (!/^[A-Za-z0-9_-]{6,32}$/.test(slug)) return error('Invalid QR link', 400);
  try {
    const incomingHeaders = event?.headers ?? {};
    const headers = new Headers();
    const userAgent = incomingHeaders['user-agent'] ?? incomingHeaders['User-Agent'];
    const referrer = incomingHeaders.referer ?? incomingHeaders.Referer;
    if (userAgent) headers.set('user-agent', userAgent);
    if (referrer) headers.set('referer', referrer);
    const upstream = await fetch(`${SUPABASE_REDIRECT_URL}?code=${encodeURIComponent(slug)}`, { method: 'GET', headers, redirect: 'manual' });
    if (upstream.status >= 300 && upstream.status < 400) {
      const location = upstream.headers.get('location');
      if (!location) return error('QR destination is unavailable', 502);
      return { statusCode: 302, headers: { Location: location, 'Cache-Control': 'no-store, max-age=0', 'Referrer-Policy': 'no-referrer' }, body: '' };
    }
    if (upstream.status === 404) return error('This QR code is unavailable', 404);
    return error('Unable to resolve this QR code right now', 502);
  } catch (cause) {
    console.error('QR redirect proxy failed', cause);
    return error('Unable to resolve this QR code right now', 502);
  }
}

export const handler = router({ 'GET /r/:slug': [resolveQr], 'HEAD /r/:slug': [resolveQr] });
