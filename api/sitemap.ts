/** Sitemap for published restaurant menu URLs. */
const escapeXml = (value: string) => value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
export default async function handler(req: any, res: any) {
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.setHeader('Allow','GET, HEAD'); res.status(405).end(); return; }
  let origin: string;
  try { const configured = new URL(process.env.SITE_URL || 'https://kineti-qr.vercel.app'); if(configured.protocol!=='https:'||configured.username||configured.password) throw new Error(); origin=configured.origin; }
  catch { res.status(500).send('Sitemap is not configured'); return; }
  const urls = [`<url><loc>${escapeXml(origin)}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>`];
  const supabaseUrl = process.env.SUPABASE_URL, anonKey = process.env.SUPABASE_ANON_KEY;
  if(supabaseUrl && anonKey) try {
    const query = new URLSearchParams({select:'slug',qr_type:'eq.menu',is_active:'eq.true',limit:'5000'});
    const response = await fetch(`${supabaseUrl}/rest/v1/qr_codes?${query}`,{headers:{apikey:anonKey,Authorization:`Bearer ${anonKey}`},cache:'no-store'});
    if(response.ok){const rows=await response.json();for(const row of Array.isArray(rows)?rows:[])if(typeof row.slug==='string'&&/^[A-Za-z0-9_-]{6,32}$/.test(row.slug))urls.push(`<url><loc>${escapeXml(origin)}/menu/${escapeXml(row.slug)}</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>`);}
  } catch(error){console.error('Sitemap menu lookup failed',error);}
  res.setHeader('Content-Type','application/xml; charset=utf-8');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Cache-Control','public, s-maxage=3600, stale-while-revalidate=86400');res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>`);
}