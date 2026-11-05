import { Resvg } from '@resvg/resvg-js';

/** Lightweight dynamic 1200x630 Open Graph artwork for restaurant menu links. */
const xml = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
}[char] as string));

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.setHeader('Allow', 'GET, HEAD'); res.status(405).end(); return; }
  const slug = String(req.query?.slug ?? '');
  if (!/^[A-Za-z0-9_-]{6,32}$/.test(slug)) {
    res.status(400).send('Invalid menu link');
    return;
  }
  const supabaseUrl = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    res.status(500).send('Menu preview is not configured');
    return;
  }
  try {
    const query = new URLSearchParams({ select: 'title,payload', slug: `eq.${slug}`, qr_type: 'eq.menu', is_active: 'eq.true', limit: '1' });
    const response = await fetch(`${supabaseUrl}/rest/v1/qr_codes?${query}`, { headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` } });
    if (!response.ok) throw new Error(`Menu lookup failed (${response.status})`);
    const rows = await response.json();
    const record = Array.isArray(rows) ? rows[0] : null;
    if (!record) { res.status(404).send('Menu unavailable'); return; }
    const payload = record.payload || {};
    const restaurant = xml(payload.restaurantName || record.title || 'Restaurant menu');
    const tagline = xml(payload.tagline || 'A menu worth sharing');
    const theme = payload.menuTheme || 'cream';
    const palettes: Record<string, [string,string,string]> = {
      cream: ['#f4ecdc','#352b25','#a77945'], midnight: ['#171923','#f6efe0','#c8a66a'], sage: ['#e8eee4','#263b31','#6e9276'], rose: ['#f6e7e9','#4a2937','#bd7188'], terracotta: ['#f3e3d5','#57352b','#bd7050'], cobalt: ['#e7f0f8','#1b304d','#477fb4'], lavender: ['#eee9f7','#392c50','#9279b5'], noir: ['#171717','#f4ead5','#c9a96b']
    };
    const [bg,fg,accent] = palettes[theme] || palettes.cream;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><defs><linearGradient id="wash" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${bg}"/><stop offset="1" stop-color="${bg}" stop-opacity=".78"/></linearGradient><pattern id="dots" width="34" height="34" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.2" fill="${accent}" opacity=".2"/></pattern></defs><rect width="1200" height="630" fill="url(#wash)"/><rect width="1200" height="630" fill="url(#dots)"/><circle cx="1040" cy="110" r="230" fill="${accent}" opacity=".08"/><circle cx="1100" cy="600" r="300" fill="${accent}" opacity=".06"/><rect x="78" y="74" width="62" height="62" rx="19" fill="${accent}"/><path d="M96 118V92h9l17 17V92h9v26h-9l-17-17v17z" fill="${bg}"/><text x="78" y="230" fill="${accent}" font-family="Arial,sans-serif" font-size="20" font-weight="700" letter-spacing="5">DIGITAL MENU</text><text x="78" y="330" fill="${fg}" font-family="Arial,sans-serif" font-size="66" font-weight="700">${restaurant.slice(0,34)}</text><text x="78" y="390" fill="${fg}" opacity=".72" font-family="Arial,sans-serif" font-size="28">${tagline.slice(0,70)}</text><path d="M78 454h130" stroke="${accent}" stroke-width="5" stroke-linecap="round"/><text x="78" y="540" fill="${fg}" opacity=".6" font-family="Arial,sans-serif" font-size="18" letter-spacing="3">QRAFT  /  MENUS MADE BEAUTIFUL</text><rect x="950" y="380" width="150" height="150" rx="30" fill="${bg}" stroke="${accent}" stroke-opacity=".3" stroke-width="2"/><path d="M985 415h34v34h-34zM1031 415h34v34h-34zM985 461h34v34h-34z" fill="${fg}"/><path d="M1028 461h10v10h-10zM1045 461h20v10h-20zM1028 478h37v17h-37z" fill="${accent}"/></svg>`;
    const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=1800');
    res.status(200).send(Buffer.from(png));
  } catch (error) {
    console.error('Qraft OG image failed', error);
    res.status(500).send('Unable to create menu preview');
  }
}
