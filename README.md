# Qraft — full source export

This is a local Vite + React + TypeScript source package based on the latest successful Qraft source snapshot (AppDeploy snapshot `1793721681501`). The frontend configuration has been moved to environment variables and the PDF/center-logo upload inputs use custom labels.

## Included

- React dashboard and authentication UI
- 17 QR formats, dynamic QR redirect support, QR styling and PNG/SVG/PDF export
- Restaurant menu builder and public menu page
- AppDeploy backend route for branded `/r/:slug` redirects
- Supabase `qr-redirect` Edge Function source
- Supabase schema/policy/storage reference SQL
- `.env.example` and setup instructions

## Requirements

- Node.js 20 or newer (Node 18.18+ may also work with this dependency set)
- npm
- A Supabase project

## Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

Open the local URL printed by Vite. Set the values in `.env` if you are connecting a different Supabase project.

## Environment variables

The browser app reads only:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` (a Supabase publishable key or legacy anon key)

The `.env.example` is prefilled with the public Qraft project URL and publishable key already used by the live frontend. These are browser-visible credentials by design and are protected by Supabase RLS.

**Never add a Supabase `service_role` key or secret API key to `.env`, source files, or any variable beginning with `VITE_`.** The `qr-redirect` Edge Function uses `SUPABASE_SERVICE_ROLE_KEY` server-side only. Supabase supplies its project environment variables to Edge Functions; verify the required server-side secret is configured in the Supabase dashboard before redeploying the function.

## Supabase setup

The existing Qraft project already has the schema, RLS policies, buckets, and Edge Function deployed. Its migration history is listed in `supabase/migration-history.txt`.

For a **new** Supabase project only:

1. Create the project and enable Email authentication.
2. Review `supabase/schema-reference.sql` and run it in the SQL Editor.
3. Deploy `supabase/functions/qr-redirect/index.ts` as an Edge Function named `qr-redirect`.
4. Ensure the Edge Function has server-side access to `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
5. Configure an AppDeploy backend route equivalent to `backend/index.ts` if you want the branded `/r/:slug` redirect path. The included backend file imports `@appdeploy/sdk` and is intended for AppDeploy hosting, not a plain Vite dev server.

Do not run the schema reference SQL on the already-configured production Qraft project; it is a schema snapshot for setup/reference, not a replay of the original seven migration files.

## Build

```bash
npm run build
npm run preview
```

## Important behavior and limitations

- Static QR codes encode their payload directly; they do not record scans.
- Dynamic URL-based QR codes use the Qraft `/r/:slug` route and the `qr-redirect` Edge Function for scan logging.
- Restaurant menu QR codes currently use a client-side hash route (`/#/menu/:slug`); menu page views are not included in scan analytics.
- The UPI QR encodes a payment intent; Qraft does not process payments.
- Product QR codes encode product details; Qraft does not process checkout.
- The `QR templates` navigation currently opens the QR builder rather than a separate template gallery.
- External phone scanning and real image-upload flows should be tested in the target hosting environment before production use.

## Project references

- Live app: https://qraft-6wjmi9.v2.appdeploy.ai/
- Supabase project ref: `irkzwaprydcvmvikglfm`
- Supabase region: Mumbai (`ap-south-1`)
