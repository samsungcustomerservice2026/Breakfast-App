/** Dish photos from `public/items`. Filename = menu item id, with aliases for new items. */
import { localAsset } from "./media.js";

export const FALLBACK_IMAGE = "/items/_fallback.jpg";

const HAS = new Set([
  "bat-boiled", "bat-ched", "bat-chips", "bat-fingers", "bat-ketch", "bat-mayo", "bat-mix",
  "bat-omelet", "bat-panne", "bat-puree", "bat-roumi", "bat-shrimp",
  "box-baba", "box-bastr", "box-batpur", "box-butter", "box-corn", "box-ghee", "box-hotoil",
  "box-mahmoug", "box-meat", "box-mesa-mt", "box-mesa-sg", "box-mesa-so", "box-mesa",
  "box-olive", "box-plain", "box-sausage", "box-shak", "box-taameya", "box-tahina", "box-tesha",
  "egg-bastr", "egg-boiled", "egg-ched", "egg-chez-tom", "egg-omelet", "egg-roll", "egg-roumi", "egg-saus",
  "foul-alex", "foul-bastr", "foul-butter", "foul-corn", "foul-egg", "foul-ghee", "foul-hot",
  "foul-meat", "foul-olive", "foul-omelet", "foul-plain", "foul-salsa", "foul-special", "foul-sug", "foul-tahina",
  "misc-baba", "misc-egga", "misc-eggpl", "misc-french", "misc-fried", "misc-mesa-mt", "misc-mesa-sg",
  "misc-mesa", "misc-shak", "misc-tomato",
  "tam-bastr", "tam-chips", "tam-egg", "tam-eggpl", "tam-fingers", "tam-kiri", "tam-mozz",
  "tam-omelet", "tam-plain", "tam-special", "tam-stuffed",
]);

const ALIAS = {
  "foul-lemon": "foul-olive", "foul-baba": "misc-baba", "foul-mesa": "misc-mesa",
  "foul-potato": "bat-puree", "foul-salad": "foul-plain", "foul-eggpl": "misc-eggpl",
  "tam-chick": "tam-egg", "tam-pickled-eggpl": "tam-eggpl", "tam-baba": "misc-baba",
  "tam-white": "tam-mozz", "tam-old": "tam-mozz", "tam-roumi": "tam-mozz", "tam-ched": "tam-mozz",
  "tam-mix": "tam-mozz", "tam-sug": "foul-sug", "tam-lemon": "foul-olive", "tam-spicy": "tam-plain",
  "tam-saus": "egg-saus", "tam-fried-mix": "tam-fingers",
  "ori-mesa": "misc-mesa", "ori-baba": "misc-baba", "ori-eggpl": "misc-eggpl", "ori-old": "misc-tomato",
  "ori-white": "misc-tomato", "ori-tomato": "misc-tomato", "ori-fries": "bat-fingers",
  "ori-pomme": "bat-fingers", "ori-chips": "bat-chips",   "ori-mash": "bat-puree",
  "ori-mash-egg": "bat-boiled", "ori-mash-omelet": "bat-omelet", "ori-mash-bastr": "bat-puree", "ori-pomme-roumi": "bat-roumi",
  "ori-dynamite": "bat-mix", "ori-shak": "misc-shak", "ori-thyme": "misc-tomato",
  "om-plain": "egg-omelet", "om-bastr": "egg-bastr", "om-sug": "egg-saus", "om-pizza": "egg-omelet",
  "om-kiri": "tam-kiri", "om-roumi": "egg-roumi", "om-ched": "egg-ched", "om-mozz": "tam-mozz",
  "om-mix": "egg-ched", "om-boiled": "egg-boiled", "om-roll": "egg-roll", "om-veg": "egg-omelet",
  "om-saus": "egg-saus",
  "green-plain": "tam-plain", "green-stuffed": "tam-stuffed", "green-bastr": "tam-bastr",
  "green-mix": "tam-mozz", "green-kiri": "tam-kiri", "green-egg": "tam-egg", "green-egg-cheese": "tam-mozz",
  "fr-plain": "bat-fingers", "fr-ketch": "bat-ketch", "fr-mayo": "bat-mayo", "fr-ketch-mayo": "bat-mix",
  "fr-egg": "bat-boiled", "fr-omelet": "bat-omelet", "fr-white": "bat-ched", "fr-roumi": "bat-roumi",
  "fr-ched": "bat-ched", "fr-mozz": "tam-mozz", "fr-mix": "bat-mix", "fr-feta": "bat-ched",
  "fr-qarish": "bat-ched", "fr-baba": "misc-baba", "fr-eggpl": "misc-eggpl", "fr-pickled-eggpl": "misc-eggpl",
  "fr-saus": "egg-saus", "fr-bazooka": "bat-fingers", "fr-chips": "bat-chips", "fr-mash": "bat-puree",
  "fr-panne": "bat-panne", "fr-mash-butter": "bat-puree", "fr-mash-egg": "bat-boiled",
  "fr-mash-omelet": "bat-omelet", "fr-mash-bastr": "bat-puree", "fr-chips-ketch": "bat-ketch",
  "fr-chips-mayo": "bat-mayo", "fr-chips-mix": "bat-mix", "fr-panne-mix": "bat-panne",
  "meat-liver": "foul-meat", "meat-sug": "foul-sug", "meat-burger": "foul-meat",
  "meat-burger-egg": "egg-omelet", "meat-burger-cheese": "tam-mozz", "meat-burger-mix": "tam-mozz",
  "meat-hawawshi": "foul-meat",
  "roll-foul": "foul-plain", "roll-tam": "tam-plain", "roll-potato": "bat-fingers",
  "roll-mix": "tam-mozz", "roll-mozz": "tam-mozz", "roll-pepper": "misc-eggpl",
  "roll-saus": "egg-saus", "roll-bastr": "tam-bastr", "roll-sug": "foul-sug",
  "roll-om-mix": "egg-omelet", "roll-falafel-mix": "tam-mozz", "roll-shabrawy": "tam-special",
  "roll-om-saus": "egg-saus", "roll-liver": "foul-meat",
  "app-lemon": "foul-olive", "app-olives": "foul-olive", "app-cucumber": "misc-eggpl",
  "app-mix-pickle": "misc-eggpl", "app-tomato": "misc-tomato", "app-eggpl-pick": "misc-eggpl",
  "app-eggpl-fried": "misc-eggpl", "app-salad": "foul-plain", "app-tahini": "box-tahina",
  "app-pickles-plate": "misc-eggpl", "app-omelet": "egg-omelet", "app-pepper": "misc-eggpl",
  "app-toum": "box-tahina",
  "misc-disc": "tam-plain", "misc-disc-stuffed": "tam-stuffed", "misc-disc-chick": "tam-egg",
  "misc-fries-pack": "bat-fingers", "misc-egg": "egg-boiled", "misc-shami-loaf": "foul-plain",
  "misc-balady-loaf": "foul-plain", "misc-disc-roumi": "tam-mozz", "misc-disc-ched": "tam-mozz",
  "misc-disc-mozz": "tam-mozz", "misc-disc-mix": "tam-mozz",
  "plt-plain": "egg-omelet", "plt-special": "egg-omelet", "plt-bastr": "egg-bastr",
  "plt-sug": "egg-saus", "plt-pizza": "egg-omelet", "plt-roumi": "egg-roumi",
  "plt-ched": "egg-ched", "plt-mozz": "tam-mozz", "plt-mix": "egg-ched",
  "box-alex": "box-plain", "box-sug": "box-sausage", "box-old": "misc-tomato",
  "box-toum": "box-tahina", "box-lemon": "foul-olive", "box-mash": "box-batpur",
  "box-mash-bastr": "box-batpur", "box-feta": "misc-tomato", "box-thyme": "misc-tomato",
};

function fileFor(id) {
  const key = String(id || "");
  if (HAS.has(key)) return `items/${key}.jpg`;
  if (ALIAS[key] && HAS.has(ALIAS[key])) return `items/${ALIAS[key]}.jpg`;
  return "items/_fallback.jpg";
}

export function itemImage(id) {
  return id ? localAsset(fileFor(id)) : FALLBACK_IMAGE;
}

export function onImgError(e) {
  const el = e.currentTarget;
  if (el.dataset.fallback) return;
  el.dataset.fallback = "1";
  el.src = FALLBACK_IMAGE;
}
