import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin"
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" }
});

function detectFile(bytes: Uint8Array): { mime: string; ext: string } | null {
  const starts = (signature: number[]) => signature.every((byte, i) => bytes[i] === byte);
  if (starts([0xff, 0xd8, 0xff])) return { mime: "image/jpeg", ext: "jpg" };
  if (starts([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { mime: "image/png", ext: "png" };
  if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF"
      && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") return { mime: "image/webp", ext: "webp" };
  if (bytes.length >= 5 && String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-") return { mime: "application/pdf", ext: "pdf" };
  return null;
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.replace(/^Bearer\s+/i, "");
  if (!token || token === authorization) return json({ error: "Authentication required" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const authClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: authData, error: authError } = await authClient.auth.getUser(token);
  if (authError || !authData.user) return json({ error: "Invalid session" }, 401);

  let form: FormData;
  try { form = await request.formData(); } catch { return json({ error: "Invalid upload form" }, 400); }
  const file = form.get("file");
  const kind = String(form.get("kind") ?? "");
  const slug = String(form.get("slug") ?? "");
  const itemId = String(form.get("itemId") ?? "");
  if (!(file instanceof File)) return json({ error: "A file is required" }, 400);
  if (!/^[A-Za-z0-9_-]{6,32}$/.test(slug)) return json({ error: "Invalid QR code reference" }, 400);

  const limits: Record<string, number> = { logo: 1024 * 1024, pdf: 20 * 1024 * 1024, "menu-image": 5 * 1024 * 1024 };
  if (!(kind in limits) || file.size === 0 || file.size > limits[kind]) return json({ error: "Unsupported file type or size" }, 413);
  if (kind === "menu-image" && !/^[A-Za-z0-9_-]{1,64}$/.test(itemId)) return json({ error: "Invalid menu item reference" }, 400);

  const bytes = new Uint8Array(await file.arrayBuffer());
  const detected = detectFile(bytes);
  const allowed = kind === "pdf" ? ["application/pdf"] : ["image/jpeg", "image/png", "image/webp"];
  if (!detected || !allowed.includes(detected.mime)) return json({ error: "File contents do not match an allowed image or PDF format" }, 415);

  const userId = authData.user.id;
  const bucket = kind === "logo" ? "qr-logos" : kind === "pdf" ? "qr-pdfs" : "qr-menu-assets";
  const path = kind === "menu-image"
    ? `${userId}/${slug}/${itemId}.${detected.ext}`
    : kind === "pdf" ? `${userId}/${slug}.pdf` : `${userId}/${slug}.${detected.ext}`;

  const storage = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error: uploadError } = await storage.storage.from(bucket).upload(path, bytes, {
    upsert: true, contentType: detected.mime, cacheControl: "3600"
  });
  if (uploadError) {
    console.error("Validated upload failed", { bucket, message: uploadError.message });
    return json({ error: "Upload failed. Please try again." }, 500);
  }
  const { data } = storage.storage.from(bucket).getPublicUrl(path);
  return json({ publicUrl: data.publicUrl, path, contentType: detected.mime });
});
