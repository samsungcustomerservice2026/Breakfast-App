import { supabase } from "./supabase.js";

export const PAY_QR_KEY = "pay_qr";
export const PAY_LINK_KEY = "pay_link";
export const PAY_QR_FALLBACK = "/pay-qr.svg";

export async function loadSetting(key, fallback = "") {
  try {
    const { data, error } = await supabase.from("app_settings").select("value").eq("key", key).maybeSingle();
    if (error) throw error;
    return data?.value || fallback;
  } catch {
    return fallback;
  }
}

export async function saveSetting(key, value) {
  const { error } = await supabase.from("app_settings").upsert({
    key,
    value: value ?? "",
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function loadPayQr() {
  return loadSetting(PAY_QR_KEY, PAY_QR_FALLBACK);
}

export async function savePayQr(dataUrl) {
  return saveSetting(PAY_QR_KEY, dataUrl);
}

export async function loadPayLink() {
  return loadSetting(PAY_LINK_KEY, "");
}

export async function savePayLink(url) {
  return saveSetting(PAY_LINK_KEY, url);
}

export function normalizePayLink(raw) {
  const t = String(raw || "").trim();
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

export function settingsSaveHint(err) {
  const msg = err?.message || "";
  const code = err?.code || "";
  if (msg.includes("app_settings") || code === "42P01") return "شغّل supabase/settings.sql في سوبابيس الأول.";
  return msg || "ما حفظناش. جرّب تاني.";
}

/** Keep original bytes when small so InstaPay QR stays scannable. */
export function fileToDataUrl(file, maxBytes = 700_000, maxEdge = 900) {
  return new Promise((resolve, reject) => {
    if (!file?.type?.startsWith("image/")) return reject(new Error("دي مش صورة يا معلم"));
    if (file.size > 2_500_000) return reject(new Error("الصورة كبيرة أوي — اختار أصغر"));
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("الصورة مش راضية تتفتح"));
    reader.onload = () => {
      if (file.size <= maxBytes) {
        resolve(reader.result);
        return;
      }
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => reject(new Error("الصورة مش راضية تتفتح"));
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
