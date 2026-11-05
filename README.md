# KinetiQR — QR management

Qraft is a standalone React + Vite application with Supabase Auth, database and Storage. It is a standalone project. The project is configured for Vercel hosting and includes Vercel Functions for dynamic QR redirects, restaurant menu social previews, OG artwork and menu scan recording.

## Included features

- Email/password sign-in and sign-up with editable profile name
- 17 QR formats: website, text, email, phone, SMS, WhatsApp, Wi-Fi, vCard, event, location, UPI, product, social, PDF, restaurant menu, app and review
- QR creation, editing, pause/resume, delete, preview and PNG/SVG/PDF export
- Custom QR colours, patterns, corner shapes and center logo upload
- Restaurant menu builder with unlimited categories and items, dish photos, prices, descriptions, veg/non-veg and availability
- Eight restaurant menu themes: Midnight Dark, Warm Cream, Fresh Sage, Fresh Shop Rose, Terracotta Table, Cobalt Studio, Lavender Haze and Noir & Gold
- Public restaurant menu pages with mobile-friendly category navigation
- Real scan analytics for dynamic redirects and menu visits (requires the server-only service role key for menu scan inserts)
- Separate dashboard areas for Overview, QR codes, Restaurant menus, Restaurant analytics, QR templates and Customization
- Dynamic menu link HTML metadata and 1200×630 social preview artwork for link unfurls
- Custom favicon, robots.txt, dynamic sitemap and basic structured metadata

## Requirements

- Node.js 20 or newer
- A Supabase project with the KinetiQR schema, policies, buckets and `qr-redirect` Edge Function configured
- A Vercel account for deployment

## Local setup

```bash
npm install
cp .env.example .env
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env`, then run:

```bash
npm run dev
```

The Vercel API functions are served locally when using Vercel CLI:

```bash
npx vercel dev
```

For local menu analytics, also set `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` in `.env`. The service role key is strictly server-side and must never be prefixed with `VITE_`. Without it, menu pages still open but restaurant menu visits will not be recorded.

## Deploy to Vercel

1. Push this folder to a Git repository, or import the project folder into Vercel.
2. Select **Vite** as the framework (Vercel also detects it automatically).
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Add these environment variables in Vercel Project Settings → Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only; required for restaurant menu scan analytics)
6. Redeploy after setting environment variables.

`vercel.json` contains SPA fallback and API rewrites. No third-party deployment SDK or proprietary hosting scripts are required.

## Supabase configuration

The existing KinetiQR Supabase project already has the database tables, row-level security, storage buckets and `qr-redirect` Edge Function. For a fresh project, use `supabase/schema-reference.sql` as a reviewed reference, then configure the `qr-redirect` Edge Function and its server-side secrets:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Never put the service role key in browser code or a `VITE_` variable.

## Dynamic links

- Dynamic QR destinations use `/r/:slug`, routed by `api/r.ts` to the Supabase `qr-redirect` Edge Function.
- Restaurant menus use `/menu/:slug`, routed by `api/menu.ts`. This endpoint emits Open Graph/Twitter metadata and a redirect into the client-rendered menu page.
- `api/menu-og.ts` renders the menu share-card as a 1200×630 PNG. Link-preview bots are excluded from scan analytics.
- Restaurant menu visits are inserted into `qr_scans` only when `SUPABASE_SERVICE_ROLE_KEY` is configured on the server.

## SEO and domain

The project includes page metadata, SoftwareApplication structured data, a custom favicon, robots.txt and a host-aware sitemap. Add your final custom domain in Vercel and update the domain-specific values in `public/robots.txt` only if you choose to hardcode a sitemap host later. Dynamic menu previews derive their canonical URL from the actual request host.

## Build and checks

```bash
npm run build
```

This runs TypeScript project checks and creates the production bundle in `dist/`.

## Security notes

- Supabase browser key is the publishable/anon key and is designed for browser use with RLS enabled.
- `SUPABASE_SERVICE_ROLE_KEY` is only read inside Vercel serverless functions.
- Public menu access is limited to the public_menu_qr_codes view and the minimum required QR columns; public menu images are served from the public asset bucket.
- Never commit `.env` or paste service role keys into frontend source.
