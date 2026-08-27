/** First tab on the shop — pinned office favorites, in this order. */
export const POPULAR_ID = "popular";

export const POPULAR_ITEMS = [
  { id: "foul-plain", nameAr: "فول" },
  { id: "foul-egg", nameAr: "فول بيض" },
  { id: "ori-mash", nameAr: "ساندويتش بيوري" },
  { id: "ori-mash-omelet", nameAr: "بيوري بيض مقلي", alt: "fr-mash-omelet" },
  { id: "ori-mash-egg", nameAr: "بيوري بيض مسلوق" },
  { id: "tam-plain", nameAr: "طعمية" },
  { id: "tam-special", nameAr: "طعمية مخصوص", alt: "tam-stuffed" },
  { id: "app-eggpl-fried", nameAr: "علبة بيتنجان" },
  { id: "box-plain", nameAr: "علبة فول" },
  { id: "box-mash", nameAr: "علبة بطاطس بيوري" },
  { id: "ori-tomato", nameAr: "جبنة طماطم" },
];

export const CAT_SHORT = {
  popular: "الأكثر",
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
