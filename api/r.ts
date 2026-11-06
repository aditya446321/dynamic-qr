/** Vercel serverless proxy for dynamic QR redirects. */
export default async function handler(req: any, res: any) {
  if(req.method!=='GET' && req.method!=='HEAD'){res.setHeader('Allow','GET, HEAD');res.status(405).end();return;}
  const slug=String(req.query?.slug??'');
  if(!/^[A-Za-z0-9_-]{6,32}$/.test(slug)){res.status(400).send('Invalid QR link');return;}
  const supabaseUrl=process.env.SUPABASE_URL;
  if(!supabaseUrl){res.status(503).send('QR redirect is temporarily unavailable');return;}
  try{
    const headers=new Headers();
    if(req.headers['user-agent'])headers.set('user-agent',String(req.headers['user-agent']).slice(0,512));
    if(req.headers.referer)headers.set('referer',String(req.headers.referer).slice(0,2048));
    const upstream=await fetch(`${supabaseUrl}/functions/v1/qr-redirect?code=${encodeURIComponent(slug)}`,{method:req.method,headers,redirect:'manual',signal:AbortSignal.timeout(5000)});
    if(upstream.status>=300&&upstream.status<400){
      const raw=upstream.headers.get('location');if(!raw){res.status(502).send('QR destination is unavailable');return;}
      let destination:URL;try{destination=new URL(raw);}catch{res.status(502).send('QR destination is invalid');return;}
      if(destination.protocol!=='https:'&&destination.protocol!=='http:'){res.status(502).send('QR destination is unsupported');return;}
      res.setHeader('Location',destination.toString());res.setHeader('Cache-Control','no-store, max-age=0');res.setHeader('Referrer-Policy','no-referrer');res.status(302).end();return;
    }
    res.status(upstream.status===404?404:502).send(upstream.status===404?'This QR code is unavailable':'Unable to resolve this QR code right now');
  }catch(error){console.error('QR redirect proxy failed',error);res.status(502).send('Unable to resolve this QR code right now');}
}