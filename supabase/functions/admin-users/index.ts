import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

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
    const { data: me } = await admin.from("profiles").select("role").eq("id", sessionData.user.id).maybeSingle();
    if (me?.role !== "super_admin") return json({ error: "المدير بس اللي يعمل كده." }, 403);

    const body = await req.json();
    const action = String(body.action || "");
    const userId = String(body.user_id || "");
    if (!userId) return json({ error: "مفيش مستخدم." }, 400);

    if (action === "set_password") {
      const password = String(body.password || "");
      if (password.length < 6) return json({ error: "الباسورد من 6 حروف." }, 400);
      const { error } = await admin.auth.admin.updateUserById(userId, { password });
      if (error) throw error;
      return json({ ok: true });
    }

    if (action === "delete") {
      if (userId === sessionData.user.id) return json({ error: "متقدرش تمسح نفسك." }, 400);
      const { data: target } = await admin.from("profiles").select("role,name").eq("id", userId).maybeSingle();
      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error) throw error;
      return json({ ok: true, name: target?.name || "" });
    }

    return json({ error: "الأمر ده مش معروف." }, 400);
  } catch (e) {
    return json({ error: (e as Error).message || "فشل." }, 500);
  }
});
