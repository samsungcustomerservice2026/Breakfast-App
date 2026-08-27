import { supabase } from "./supabase.js";
import { safeStorageName } from "./safeName.js";

export const LOGO_BUCKET = "Logo";
export const MEMES_BUCKET = "memes";
export const MENU_BUCKET = "menu";
export const LOGO_PATH = "logo.png";
export const MEDIA_REV_KEY = "media_rev";

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|jfif|avif)$/i;

let currentRev = "";

export function setMediaRev(rev = "") {
  currentRev = String(rev || "");
}

function encodePath(path) {
  return String(path || "")
    .replace(/^\//, "")
    .split("/")
    .filter(Boolean)
    .map(encodeURIComponent)
    .join("/");
}

export function publicObject(bucket, path, rev) {
  const base = import.meta.env.VITE_SUPABASE_URL;
  const clean = encodePath(path);
  if (!base || !bucket || !clean) return `/${path || ""}`;
  const v = rev == null || rev === "" ? currentRev : rev;
  const q = v ? `?v=${encodeURIComponent(v)}` : "";
  return `${base}/storage/v1/object/public/${bucket}/${clean}${q}`;
}

export function localAsset(path) {
  return `/${String(path).replace(/^\//, "")}`;
}

/** @deprecated use publicObject with the right bucket */
export function mediaSrc(path, rev) {
  const clean = String(path || "").replace(/^\//, "");
  if (clean === LOGO_PATH || clean.endsWith("/logo.png")) return publicObject(LOGO_BUCKET, LOGO_PATH, rev);
  if (clean.startsWith("memes/")) return publicObject(MEMES_BUCKET, clean.slice(6), rev);
  if (clean.startsWith("items/")) return publicObject(MENU_BUCKET, clean.slice(6), rev);
  return publicObject(MENU_BUCKET, clean, rev);
}

export async function listImageUrls(bucket) {
  const { data, error } = await supabase.storage.from(bucket).list("", {
    limit: 200,
    sortBy: { column: "name", order: "asc" },
  });
  if (error) return [];
  return (data || [])
    .filter((f) => f.name && IMAGE_EXT.test(f.name))
    .map((f) => publicObject(bucket, f.name));
}

export async function resolveLogoSrc(rev) {
  if (rev) return publicObject(LOGO_BUCKET, LOGO_PATH, rev);
  return "/logo.png?v=fit";
}

export async function uploadAsset(path, file, bucket = LOGO_BUCKET) {
  const raw = String(path || "").replace(/^\//, "") || file?.name || "file.jpg";
  const parts = raw.replace(/\\/g, "/").split("/").filter(Boolean);
  const fileName = safeStorageName(parts.pop() || file?.name || "file.jpg");
  const dirs = parts.map((p) => p.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-|-$/g, "")).filter(Boolean);
  const clean = [...dirs, fileName].join("/");
  const { error } = await supabase.storage.from(bucket).upload(clean, file, {
    upsert: true,
    contentType: file.type || "image/png",
    cacheControl: "3600",
  });
  if (error) throw error;
  return clean;
}

export function onMediaError(localPath) {
  return (e) => {
    const el = e.currentTarget;
    if (!el.dataset.local) {
      el.dataset.local = "1";
      el.src = localAsset(localPath || el.dataset.localPath || "");
    }
  };
}
