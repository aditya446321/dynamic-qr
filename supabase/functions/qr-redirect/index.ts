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

async function rateLimitDigest(value: string): Promise<string> {
  const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (request: Request) => {
  const slug = new URL(request.url).searchParams.get("code") ?? "";
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
  }
  if (!/^[A-Za-z0-9_-]{6,32}$/.test(slug)) return new Response("Invalid QR code", { status: 400 });

  // Supabase's edge proxy supplies the client address in these headers. Only a
  // Keyed HMAC digests are stored; raw IP addresses are never persisted.
  const forwarded = request.headers.get("cf-connecting-ip")
    ?? request.headers.get("x-real-ip")
    ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? "unknown";
  const ipHash = await rateLimitDigest(forwarded);
  const slugHash = await rateLimitDigest(slug);
  const windowStart = new Date(Math.floor(Date.now() / 60_000) * 60_000).toISOString();

  const [ipLimit, slugLimit] = await Promise.all([
    supabase.rpc("consume_qr_scan_rate_limit", {
      p_key_hash: ipHash, p_scope: "ip", p_window_start: windowStart, p_limit: 120, p_slug: null
    }),
    supabase.rpc("consume_qr_scan_rate_limit", {
      p_key_hash: await rateLimitDigest(ipHash + ":" + slugHash), p_scope: "ip_slug",
      p_window_start: windowStart, p_limit: 30, p_slug: slug
    })
  ]);
  if (ipLimit.error || slugLimit.error) {
    console.error("QR scan rate limiter unavailable", ipLimit.error?.message ?? slugLimit.error?.message);
    return new Response("Temporarily unavailable", { status: 503, headers: { "Retry-After": "30", "Cache-Control": "no-store" } });
  }
  if ((ipLimit.data ?? 0) > 120 || (slugLimit.data ?? 0) > 30) {
    console.warn("QR scan rate limit exceeded", { scope: (ipLimit.data ?? 0) > 120 ? "ip" : "ip_slug", slug });
    return new Response("Too many requests", { status: 429, headers: { "Retry-After": "60", "Cache-Control": "no-store" } });
  }

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
