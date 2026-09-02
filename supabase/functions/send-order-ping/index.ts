import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { buildPushPayload } from "npm:@block65/webcrypto-web-push@1.0.2";

const TITLE = "هيئة مكافحة الجوع المش رسمية";
const BODY = "الأكل وصل — انزل خد الأوردر يا معلم";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader) return json({ error: "مش داخل" }, 401);

    const url = Deno.env.get("SUPABASE_URL") || "";
    const anon = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const userClient = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
    const { data: sessionData, error: sessionErr } = await userClient.auth.getUser();
    if (sessionErr || !sessionData.user) return json({ error: "مش داخل" }, 401);

    const admin = createClient(url, service);
    const { data: me } = await admin.from("profiles").select("role,is_admin").eq("id", sessionData.user.id).maybeSingle();
    if (!(me?.is_admin || me?.role === "admin" || me?.role === "super_admin")) {
      return json({ error: "المأمور بس اللي ينبّه." }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const userIds = [...new Set(
      (Array.isArray(body.user_ids) ? body.user_ids : [])
        .map((id: unknown) => String(id || "").trim())
        .filter(Boolean)
    )];
    if (!userIds.length) return json({ error: "مفيش ناس." }, 400);

    const { data: vapidRow } = await admin
      .from("app_push_vapid")
      .select("public_key,private_key,subject")
      .eq("id", 1)
      .maybeSingle();

    const vapid = {
      subject: Deno.env.get("VAPID_SUBJECT") || vapidRow?.subject || "mailto:breakfast-app@local",
      publicKey: Deno.env.get("VAPID_PUBLIC_KEY") || vapidRow?.public_key || "",
      privateKey: Deno.env.get("VAPID_PRIVATE_KEY") || vapidRow?.private_key || "",
    };
    if (!vapid.publicKey || !vapid.privateKey) {
      return json({ error: "مفاتيح التنبيه مش متظبطة." }, 500);
    }

    const { data: subs, error: subErr } = await admin
      .from("push_subscriptions")
      .select("id,endpoint,p256dh,auth")
      .in("user_id", userIds);
    if (subErr) throw subErr;

    const title = String(body.title || TITLE);
    const message = String(body.message || BODY);
    const stale: string[] = [];
    let sent = 0;

    await Promise.all((subs || []).map(async (row) => {
      try {
        const payload = await buildPushPayload(
          {
            data: JSON.stringify({ title, body: message, url: "/" }),
            options: { ttl: 60 * 60 * 12, urgency: "high" },
          },
          {
            endpoint: row.endpoint,
            expirationTime: null,
            keys: { p256dh: row.p256dh, auth: row.auth },
          },
          vapid,
        );
        const res = await fetch(row.endpoint, payload);
        if (res.status === 404 || res.status === 410) stale.push(row.id);
        else if (res.ok || res.status === 201) sent += 1;
      } catch {
        /* one dead phone should not block the rest */
      }
    }));

    if (stale.length) {
      await admin.from("push_subscriptions").delete().in("id", stale);
    }

    return json({ ok: true, sent, stale: stale.length, targets: (subs || []).length });
  } catch (e) {
    return json({ error: (e as Error).message || "فشل." }, 500);
  }
});
