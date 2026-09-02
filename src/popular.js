/** First tab on the shop — pinned office favorites, in this order. */
export const POPULAR_ID = "popular";

export const POPULAR_ITEMS = [
  { id: "box-olive", nameAr: "علبة فول زيت زيتون" },
  { id: "box-mash", nameAr: "علبة بيوري" },
  { id: "foul-omelet", nameAr: "فول بيض أومليت" },
  { id: "foul-egg", nameAr: "فول بيض مسلوق" },
  { id: "foul-plain", nameAr: "فول" },
  { id: "tam-plain", nameAr: "طعمية" },
  { id: "ori-tomato", nameAr: "جبنة" },
  { id: "ori-mash-omelet", nameAr: "مهروسة أومليت", alt: "fr-mash-omelet" },
  { id: "om-plain", nameAr: "أومليت" },
  { id: "foul-alex", nameAr: "فول اسكندراني" },
];

export const HIDDEN_SHOP_CATS = new Set(["green", "rolls", "meat", "omelet_plates"]);

export const HIDDEN_ORIENTAL_IDS = new Set([
  "ori-fries",
  "ori-pomme",
  "ori-chips",
  "ori-mash",
  "ori-mash-egg",
  "ori-mash-bastr",
  "ori-mash-omelet",
  "ori-pomme-roumi",
]);

export const CAT_SHORT = {
  popular: "الأكثر طلبًا",
  foul: "فول",
  taameya: "طعمية",
  oriental: "شرقي",
  omelet: "أومليت",
  omelet_plates: "أطباق",
  meat: "لحوم",
  green: "جرين",
  rolls: "رول",
  fries: "بطاطس",
  apps: "مقبلات",
  misc: "منوع",
  boxes: "علب",
};

export const CAT_ICON = {
  popular: "foul-plain",
  foul: "foul-plain",
  taameya: "tam-plain",
  oriental: "ori-mash",
  omelet: "egg-omelet",
  omelet_plates: "egg-omelet",
  meat: "foul-meat",
  green: "tam-plain",
  rolls: "tam-plain",
  fries: "bat-fingers",
  apps: "misc-eggpl",
  misc: "tam-plain",
  boxes: "box-plain",
};

export const POPULAR_ID_SET = new Set(
  POPULAR_ITEMS.flatMap((p) => (p.alt ? [p.id, p.alt] : [p.id]))
);
