/** Public dynamic QR resolver proxy. Preserves safe redirects and dynamic action pages. */
export default async function handler(req: any, res: any) {
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.setHeader('Allow','GET, HEAD'); res.status(405).end(); return; }
  const slug=String(req.query?.slug??'');
  if(!/^[A-Za-z0-9_-]{6,32}$/.test(slug)){res.status(400).send('Invalid QR link');return;}
  const supabaseUrl=process.env.SUPABASE_URL;
  if(!supabaseUrl){res.status(503).send('QR resolver is temporarily unavailable');return;}
  try{
    const headers=new Headers();
    if(req.headers['user-agent'])headers.set('user-agent',String(req.headers['user-agent']).slice(0,512));
    if(req.headers.referer)headers.set('referer',String(req.headers.referer).slice(0,2048));
    const upstream=await fetch(`${supabaseUrl}/functions/v1/qr-redirect?code=${encodeURIComponent(slug)}`,{method:req.method,headers,redirect:'manual',signal:AbortSignal.timeout(7000)});
    const location=upstream.headers.get('location');
    if(upstream.status>=300&&upstream.status<400&&location){
      let destination:URL;try{destination=new URL(location);}catch{res.status(502).send('QR destination is invalid');return;}
      if(destination.protocol!=='https:'&&destination.protocol!=='http:'&&destination.protocol!=='mailto:'&&destination.protocol!=='tel:'&&destination.protocol!=='sms:'&&destination.protocol!=='upi:'){res.status(502).send('QR destination is unsupported');return;}
      res.setHeader('Location',destination.toString());res.setHeader('Cache-Control','no-store, max-age=0');res.setHeader('Referrer-Policy','no-referrer');res.status(upstream.status).end();return;
    }
    const type=upstream.headers.get('content-type')||'text/plain; charset=utf-8';
    res.setHeader('Content-Type',type);res.setHeader('Cache-Control','no-store, max-age=0');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','DENY');
    const body=req.method==='HEAD'?'':await upstream.text();
    res.status(upstream.status).send(body);
  }catch(error){console.error('QR resolver proxy failed',error);res.status(502).send('Unable to open this QR right now');}
}
