/** Social-preview HTML endpoint for public restaurant menus. */
const escapeHtml = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char] as string));
const canonicalOrigin = () => {
  const configured = process.env.SITE_URL || 'https://kineti-qr.vercel.app';
  const url = new URL(configured);
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Invalid SITE_URL');
  return url.origin;
};
const descriptionFor = (payload: Record<string, any>) => {
  const dishes = (Array.isArray(payload.sections) ? payload.sections : [])
    .flatMap((section: any) => Array.isArray(section.items) ? section.items : [])
    .filter((item: any) => item?.name && item.available !== false)
    .slice(0, 3).map((item: any) => item.name);
  const base = payload.restaurantDescription || payload.tagline || 'Explore the food and drinks on our digital menu.';
  return `${base}${dishes.length ? ` Popular picks: ${dishes.join(', ')}.` : ''}`.slice(0, 260);
};
export default async function handler(req: any, res: any) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD'); res.status(405).end(); return;
  }
  const slug = String(req.query?.slug ?? '');
  if (!/^[A-Za-z0-9_-]{6,32}$/.test(slug)) { res.status(400).send('Invalid menu link'); return; }
  const supabaseUrl = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) { res.status(503).send('Menu preview is temporarily unavailable'); return; }
  try {
    const origin = canonicalOrigin();
    const query = new URLSearchParams({ select: 'id,title,slug,payload', slug: `eq.${slug}`, limit: '1' });
    const lookup = await fetch(`${supabaseUrl}/rest/v1/public_menu_qr_codes?${query}`, { headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` }, cache: 'no-store' });
    if (!lookup.ok) throw new Error(`Menu lookup failed (${lookup.status})`);
    const rows = await lookup.json(); const record = Array.isArray(rows) ? rows[0] : null;
    if (!record) { res.status(404).send('This restaurant menu is unavailable'); return; }
    const payload = record.payload || {};
    const restaurant = payload.restaurantName || record.title || 'Restaurant menu';
    const title = `${restaurant} | Digital Menu`;
    const description = descriptionFor(payload);
    const canonical = `${origin}/menu/${slug}`;
    const image = `${origin}/api/menu-og?slug=${encodeURIComponent(slug)}`;
    const ua = String(req.headers['user-agent'] || '');
    const isBot = /bot|crawler|spider|preview|facebookexternalhit|whatsapp|telegram|slack|discord|twitter|linkedin/i.test(ua);
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!isBot && serviceKey) {
      const device = /ipad|tablet|playbook|silk/i.test(ua) ? 'tablet' : /mobi|android|iphone|ipod/i.test(ua) ? 'mobile' : ua ? 'desktop' : 'unknown';
      const referrer = req.headers.referer ? (() => { try { return new URL(String(req.headers.referer)).origin; } catch { return null; } })() : null;
      await fetch(`${supabaseUrl}/rest/v1/qr_scans`, { method: 'POST', headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify({ qr_code_id: record.id, device_type: device, referrer }) }).catch(() => {});
    }
    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}"><link rel="canonical" href="${escapeHtml(canonical)}"><meta name="robots" content="index,follow,max-image-preview:large"><meta property="og:type" content="website"><meta property="og:site_name" content="KinetiQR"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:url" content="${escapeHtml(canonical)}"><meta property="og:image" content="${escapeHtml(image)}"><meta property="og:image:type" content="image/png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escapeHtml(title)}"><meta name="twitter:description" content="${escapeHtml(description)}"><meta name="twitter:image" content="${escapeHtml(image)}"></head><body><main><h1>${escapeHtml(restaurant)}</h1><p>Opening the restaurant menu…</p><a href="/#/menu/${encodeURIComponent(slug)}">Open menu</a></main><script>window.location.replace('/#/menu/${encodeURIComponent(slug)}');</script></body></html>`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.setHeader('Cache-Control', 'no-store, max-age=0'); res.setHeader('X-Content-Type-Options','nosniff'); res.setHeader('Referrer-Policy','no-referrer'); res.status(200).send(html);
  } catch (error) { console.error('Menu preview failed', error); res.status(500).send('Unable to open this menu right now'); }
}
