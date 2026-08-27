import { createClient } from "@supabase/supabase-js";
import { readdir, readFile } from "fs/promises";
import { join, extname } from "path";

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = "menu";
const itemsDir = join(process.cwd(), "public", "items");

if (!url || !key) {
  console.error("Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env, then:");
  console.error("  npm run upload-assets");
  process.exit(1);
}

const supabase = createClient(url, key);
const okExt = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

const names = await readdir(itemsDir);
const files = names.filter((n) => !n.startsWith("_") && okExt.has(extname(n).toLowerCase()));

let ok = 0;
for (const name of files) {
  const body = await readFile(join(itemsDir, name));
  const { error } = await supabase.storage.from(bucket).upload(name, body, {
    upsert: true,
    contentType: mime(name),
    cacheControl: "3600",
  });
  if (error) console.error("FAIL", name, error.message);
  else {
    ok += 1;
    console.log("OK", name);
  }
}
console.log(`uploaded ${ok}/${files.length} → bucket ${bucket}`);

function mime(p) {
  const e = extname(p).toLowerCase();
  if (e === ".png") return "image/png";
  if (e === ".webp") return "image/webp";
  if (e === ".gif") return "image/gif";
  return "image/jpeg";
}
