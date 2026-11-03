import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } }
);

function getDeviceType(userAgent: string): "mobile" | "tablet" | "desktop" | "unknown" {
  if (!userAgent) return "unknown";
  if (/iPad|Tablet|PlayBook|Silk/i.test(userAgent)) return "tablet";
  if (/Mobi|Android|iPhone|iPod/i.test(userAgent)) return "mobile";
  return "desktop";
}

Deno.serve(async (request: Request) => {
  const slug = new URL(request.url).searchParams.get("code") ?? "";
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
  }
  if (!/^[A-Za-z0-9_-]{6,32}$/.test(slug)) return new Response("Invalid QR code", { status: 400 });

  const { data: qrCode, error: lookupError } = await supabase
    .from("qr_codes").select("id, target_url").eq("slug", slug).eq("is_active", true)
    .eq("is_dynamic", true).in("qr_type", ["website", "pdf", "menu", "app", "review", "social"]).maybeSingle();
  if (lookupError || !qrCode?.target_url) return new Response("This QR code is unavailable", { status: 404 });

  let destination: URL;
  try { destination = new URL(qrCode.target_url); }
  catch { return new Response("This QR destination is invalid", { status: 410 }); }
  if (destination.protocol !== "https:" && destination.protocol !== "http:") return new Response("Unsupported QR destination", { status: 410 });

  const referrerHeader = request.headers.get("referer");
  let referrer: string | null = null;
  if (referrerHeader) { try { referrer = new URL(referrerHeader).origin; } catch { referrer = null; } }
  const scanTask = supabase.from("qr_scans").insert({
    qr_code_id: qrCode.id, referrer, device_type: getDeviceType(request.headers.get("user-agent") ?? "")
  }).then(({ error }) => { if (error) console.error("Could not record QR scan", error.message); });
  EdgeRuntime.waitUntil(scanTask);

  return new Response(null, { status: 302, headers: {
    Location: destination.toString(), "Cache-Control": "no-store, max-age=0",
    "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff"
  }});
});
