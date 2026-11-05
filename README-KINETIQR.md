# KinetiQR

## Production domain
The app derives public links and canonical metadata from the current deployment origin. Configure VITE_SITE_URL only when you intentionally want a different canonical origin; use the exact HTTPS origin without a trailing path.

Current Vercel production URL: https://kineti-qr.vercel.app/

## Theme colors
Edit the CSS variables at the top of src/index.css: --ink, --muted, --orange, --bg-1, --bg-2, --bg-3, and related tokens.

## Brand assets
npm run build runs scripts/generate-brand-assets.mjs to create favicon/app icon PNGs, the multi-size ICO and the 1200x630 OG image from editable SVG artwork.

## Link-preview testing checklist
- [ ] Facebook Sharing Debugger: https://developers.facebook.com/tools/debug/
- [ ] LinkedIn Post Inspector: https://www.linkedin.com/post-inspector/
- [ ] WhatsApp: send the public URL to yourself and check the preview
- [ ] opengraph.xyz: https://www.opengraph.xyz/

## Build
Run npm install, then npm run build. Keep VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY configured in Vercel.
