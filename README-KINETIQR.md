# KinetiQR

## Domain setup
Replace `YOUR-DOMAIN.com` in `index.html` and the canonical/social URL helper with your production hostname. For Vercel, set `VITE_SITE_URL` to the final https origin before building.

## Theme colors
Edit the CSS variables at the top of `src/index.css`: `--ink`, `--muted`, `--orange`, `--bg-1`, `--bg-2`, `--bg-3`, and related tokens.

## Brand assets
`npm run build` runs the prebuild script `scripts/generate-brand-assets.mjs` to create all favicon/app icon PNGs, the multi-size ICO and the 1200×630 OG image from editable SVG artwork.

## Link-preview testing checklist
- [ ] Facebook Sharing Debugger: https://developers.facebook.com/tools/debug/
- [ ] LinkedIn Post Inspector: https://www.linkedin.com/post-inspector/
- [ ] X Card Validator (availability may vary): https://cards-dev.twitter.com/validator
- [ ] WhatsApp: send the public URL to yourself and check the preview
- [ ] opengraph.xyz: https://www.opengraph.xyz/

Set the production domain before testing. Request a re-scrape after updating metadata or the OG image.

## Build
Run `npm install`, then `npm run build`. Keep `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` configured in Vercel.
