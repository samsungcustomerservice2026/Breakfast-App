import { readdir, readFile, mkdir, writeFile, copyFile, rm } from "fs/promises";
import { existsSync } from "fs";
import { dirname, extname, join } from "path";
import { fileURLToPath } from "url";
import { safeStorageName } from "../src/safeName.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const srcRoot = "F:/Samsung Tools/Breakfast app/mems";
const outRoot = join(root, "public", "memes");

export const SITUATIONS = [
  { id: "second_item", folder: "after choosing 2nd sandwich", label: "After choosing the second sandwich", labelAr: "تاني ساندوتش" },
  { id: "many_items", folder: "more than 2 items", label: "More than two items in the cart", labelAr: "أكتر من صنفين" },
  { id: "cheese", folder: "cheese", label: "Cheese sandwich", labelAr: "جبنة" },
  { id: "egg", folder: "Egg", label: "Egg sandwich", labelAr: "بيض" },
  { id: "foul", folder: "foul", label: "Foul sandwich", labelAr: "فول" },
  { id: "potato", folder: "Potato", label: "Potato sandwich", labelAr: "بطاطس" },
  { id: "taameya", folder: "ta3mya", label: "Taameya sandwich", labelAr: "طعمية" },
  { id: "pay_one", folder: "if he choosed only one sandwich and going to paaay", label: "Paying with only one sandwich", labelAr: "دفع ساندوتش واحد" },
  { id: "remove", folder: "if removed something from cart", label: "Removed something from the cart", labelAr: "شال حاجة من العربية" },
  { id: "idle", folder: "when heee delayed ordering more than 60 seconds whithout ordering", label: "Waited 60 seconds without ordering", labelAr: "قعد 60 ثانية من غير طلب" },
  { id: "pay", folder: "when tending to paaay", label: "Going to pay", labelAr: "رايح يدفع" },
];

const okExt = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".jfif"]);

function webExt(name) {
  const e = extname(name).toLowerCase();
  if (e === ".jfif" || e === ".jpeg") return ".jpg";
  return e || ".jpg";
}

function mime(name) {
  const e = webExt(name);
  if (e === ".png") return "image/png";
  if (e === ".webp") return "image/webp";
  if (e === ".gif") return "image/gif";
  return "image/jpeg";
}

async function filesIn(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const n of await readdir(dir, { withFileTypes: true })) {
    if (!n.isFile()) continue;
    if (!okExt.has(extname(n.name).toLowerCase())) continue;
    out.push(n.name);
  }
  return out;
}

const catalog = {};
const rows = [];

for (const sit of SITUATIONS) {
  const from = join(srcRoot, sit.folder);
  const dest = join(outRoot, sit.id);
  await mkdir(dest, { recursive: true });
  const used = new Set();
  catalog[sit.id] = [];
  let i = 0;
  for (const name of await filesIn(from)) {
    i += 1;
    let key = safeStorageName(name.replace(/\.[^.]+$/, webExt(name)));
    if (used.has(key)) key = key.replace(/(\.[^.]+)$/, `-${i}$1`);
    used.add(key);
    const rel = `memes/${sit.id}/${key}`;
    await copyFile(join(from, name), join(dest, key));
    catalog[sit.id].push(rel);
    rows.push({ situation: sit.id, path: rel, original_name: name, sort: i });
    console.log("COPY", rel, "←", name);
  }
}

const keep = new Set(SITUATIONS.map((s) => s.id));
if (existsSync(outRoot)) {
  for (const n of await readdir(outRoot, { withFileTypes: true })) {
    if (n.isDirectory() && !keep.has(n.name)) {
      await rm(join(outRoot, n.name), { recursive: true, force: true });
      console.log("RM stale", n.name);
    }
  }
}

const gen = `export const MEME_SITUATIONS = ${JSON.stringify(SITUATIONS.map(({ id, label, labelAr }) => ({ id, label, labelAr })), null, 2)};\nexport const MEME_CATALOG = ${JSON.stringify(catalog, null, 2)};\n`;
await writeFile(join(root, "src", "memeCatalog.js"), gen);
await writeFile(join(root, "supabase", "meme_files_seed.json"), JSON.stringify(rows, null, 2));
console.log(`catalog ${rows.length} files → public/memes/{situation}/`);

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (url && key) {
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(url, key);
  let ok = 0;
  for (const row of rows) {
    const body = await readFile(join(root, "public", row.path));
    const { error } = await supabase.storage.from("memes").upload(row.path.replace(/^memes\//, ""), body, {
      upsert: true,
      contentType: mime(row.path),
      cacheControl: "3600",
    });
    if (error) console.error("FAIL", row.path, error.message);
    else {
      ok += 1;
      console.log("UP", row.path);
    }
  }
  console.log(`uploaded ${ok}/${rows.length} → bucket memes`);
} else {
  console.log("No SUPABASE_SERVICE_ROLE_KEY — files are in public/ for Vercel. DB seed still applies.");
}
