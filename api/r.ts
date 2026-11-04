/** Vercel serverless proxy for Qraft dynamic QR redirects. */
export default async function handler(req: any, res: any) {
  const slug = String(req.query?.slug ?? '');
  if (!/^[A-Za-z0-9_-]{6,32}$/.test(slug)) {
    res.status(400).send('Invalid QR link');
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) {
    res.status(500).send('QR redirect is not configured');
    return;
  }

  try {
    const headers = new Headers();
    if (req.headers['user-agent']) headers.set('user-agent', String(req.headers['user-agent']));
    if (req.headers.referer) headers.set('referer', String(req.headers.referer));
    const upstream = await fetch(`${supabaseUrl}/functions/v1/qr-redirect?code=${encodeURIComponent(slug)}`, {
      method: req.method === 'HEAD' ? 'HEAD' : 'GET',
      headers,
      redirect: 'manual'
    });

    if (upstream.status >= 300 && upstream.status < 400) {
      const destination = upstream.headers.get('location');
      if (!destination) {
        res.status(502).send('QR destination is unavailable');
        return;
      }
      res.setHeader('Location', destination);
      res.setHeader('Cache-Control', 'no-store, max-age=0');
      res.setHeader('Referrer-Policy', 'no-referrer');
      res.status(302).end();
      return;
    }

    res.status(upstream.status === 404 ? 404 : 502).send(
      upstream.status === 404 ? 'This QR code is unavailable' : 'Unable to resolve this QR code right now'
    );
  } catch (error) {
    console.error('Qraft redirect proxy failed', error);
    res.status(502).send('Unable to resolve this QR code right now');
  }
}
