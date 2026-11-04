export default function handler(req: any, res: any) {
  const host = String(req.headers.host || 'localhost');
  const protocol = req.headers['x-forwarded-proto'] === 'http' ? 'http' : 'https';
  const origin = `${protocol}://${host}`;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(`User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /r/\nSitemap: ${origin}/sitemap.xml\n`);
}
