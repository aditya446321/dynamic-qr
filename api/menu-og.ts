import { Resvg } from '@resvg/resvg-js';
const xml = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[char] as string));
export default async function handler(req: any, res: any) {
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.setHeader('Allow','GET, HEAD'); res.status(405).end(); return; }
  const slug = String(req.query?.slug ?? '');
  if (!/^[A-Za-z0-9_-]{6,32}$/.test(slug)) { res.status(400).send('Invalid menu link'); return; }
  const supabaseUrl = process.env.SUPABASE_URL, anonKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) { res.status(503).send('Menu preview is temporarily unavailable'); return; }
  try {
    const query = new URLSearchParams({select:'title,payload',slug:`eq.${slug}`,qr_type:'eq.menu',is_active:'eq.true',limit:'1'});
    const response = await fetch(`${supabaseUrl}/rest/v1/qr_codes?${query}`,{headers:{apikey:anonKey,Authorization:`Bearer ${anonKey}`},cache:'no-store'});
    if (!response.ok) throw new Error(`Menu lookup failed (${response.status})`);
    const rows = await response.json(), record = Array.isArray(rows) ? rows[0] : null;
    if (!record) { res.status(404).send('Menu unavailable'); return; }
    const payload = record.payload || {}, restaurant = xml(payload.restaurantName || record.title || 'Restaurant menu'), tagline = xml(payload.tagline || 'A menu worth sharing');
    const palettes: Record<string,[string,string,string]> = {cream:['#f4ecdc','#352b25','#a77945'],midnight:['#171923','#f6efe0','#c8a66a'],sage:['#e8eee4','#263b31','#6e9276'],rose:['#f6e7e9','#4a2937','#bd7188'],terracotta:['#f3e3d5','#57352b','#bd7050'],cobalt:['#e7f0f8','#1b304d','#477fb4'],lavender:['#eee9f7','#392c50','#9279b5'],noir:['#171717','#f4ead5','#c9a96b']};
    const [bg,fg,accent] = palettes[payload.menuTheme] || palettes.cream;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="${bg}"/><circle cx="1040" cy="110" r="230" fill="${accent}" opacity=".08"/><text x="78" y="230" fill="${accent}" font-family="Arial" font-size="20">DIGITAL MENU</text><text x="78" y="330" fill="${fg}" font-family="Arial" font-size="66" font-weight="700">${restaurant.slice(0,34)}</text><text x="78" y="390" fill="${fg}" font-family="Arial" font-size="28">${tagline.slice(0,70)}</text></svg>`;
    const png = new Resvg(svg,{fitTo:{mode:'width',value:1200}}).render().asPng();
    res.setHeader('Content-Type','image/png'); res.setHeader('X-Content-Type-Options','nosniff'); res.setHeader('Cache-Control','public, s-maxage=300, stale-while-revalidate=1800'); res.status(200).send(Buffer.from(png));
  } catch (error) { console.error('Menu OG generation failed',error); res.status(500).send('Unable to create menu preview'); }
}