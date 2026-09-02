import { supabase } from "./supabase.js";
import { MEME_CATALOG } from "./memeCatalog.js";

function isCheese(itemId) {
  const s = String(itemId);
  if (/kiri|mozz|ched|roumi|feta|qarish|cheese|gbna|thyme/.test(s)) return true;
  if (/(?:^|-)(?:white|old)(?:-|$)/.test(s)) return true;
  if (/mix/.test(s) && !/pickle|fried-mix/.test(s)) return true;
  return false;
}

let catalog = { ...MEME_CATALOG };

export async function loadMemeCatalog() {
  try {
    const { data, error } = await supabase.from("meme_files").select("situation, path").order("sort");
    if (error || !data?.length) return catalog;
    const next = {};
    for (const row of data) {
      if (!row.situation || !row.path) continue;
      (next[row.situation] ||= []).push(row.path);
    }
    if (Object.keys(next).length) catalog = { ...MEME_CATALOG, ...next };
  } catch { /* keep bundled catalog */ }
  return catalog;
}

function norm(s) {
  return String(s || "")
    .replace(/^https?:\/\/[^/]+\/storage\/v1\/object\/public\/[^/]+\//, "")
    .replace(/^\//, "")
    .split("?")[0];
}

function fromPool(situation, exceptSrc) {
  const pool = catalog[situation] || [];
  if (!pool.length) return "";
  const except = norm(exceptSrc);
  const list = pool.filter((m) => norm(m) !== except);
  const use = list.length ? list : pool;
  const pick = use[Math.floor(Math.random() * use.length)];
  const path = norm(pick);
  return path ? `/${path}` : "";
}

function situationForAdd({ itemId, catId, count }) {
  if (count === 2) return "second_item";
  if (count >= 3) return "many_items";
  if (isCheese(itemId) || catId === "oriental") return "cheese";
  if (catId === "foul" || String(itemId).startsWith("foul-") || String(itemId).startsWith("box-plain") || String(itemId).startsWith("box-alex") || String(itemId).startsWith("box-olive") || String(itemId).startsWith("box-sug") || String(itemId).startsWith("box-hotoil") || String(itemId).startsWith("box-lemon") || String(itemId).startsWith("box-bastr") || String(itemId).startsWith("box-butter")) return "foul";
  if (catId === "taameya" || catId === "green" || String(itemId).startsWith("tam-") || String(itemId).startsWith("green-")) return "taameya";
  if (catId === "omelet" || catId === "omelet_plates" || catId === "eggs" || String(itemId).startsWith("om-") || String(itemId).startsWith("plt-") || String(itemId).startsWith("egg-")) return "egg";
  if (catId === "fries" || catId === "batates" || String(itemId).startsWith("fr-") || String(itemId).startsWith("bat-") || String(itemId).startsWith("ori-fries") || String(itemId).startsWith("ori-pomme") || String(itemId).startsWith("ori-chips") || String(itemId).startsWith("ori-mash")) return "potato";
  return "second_item";
}

/**
 * Standalone situation pools from meme_files.
 * if count===2 → second_item
 * if count>=3 → many_items
 * else cheese / foul / taameya / egg / potato from the item
 */
export function pickSituationMeme({ event, itemId, catId, count, exceptSrc }) {
  let situation = "";
  let shake = false;

  if (event === "idle") situation = "idle";
  else if (event === "remove") situation = "remove";
  else if (event === "pay_one") situation = "pay_one";
  else if (event === "pay") situation = "pay";
  else if (event === "delivered") situation = "delivered";
  else if (event === "add") {
    situation = situationForAdd({ itemId, catId, count });
    if (situation === "many_items") shake = true;
  }

  const src = situation ? fromPool(situation, exceptSrc) : "";
  return { src, shake, situation };
}
