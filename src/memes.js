export const MEMES = [
  "/memes/meme-01.jpg",
  "/memes/meme-02.webp",
  "/memes/meme-03.jpg",
  "/memes/meme-04.jpg",
  "/memes/meme-05.jpg",
  "/memes/meme-06.png",
  "/memes/meme-07.jpg",
  "/memes/meme-08.jpg",
  "/memes/meme-09.jpg",
  "/memes/meme-10.webp",
  "/memes/meme-11.jpg",
  "/memes/meme-12.jpg",
  "/memes/meme-13.jpg",
  "/memes/meme-14.jpg",
  "/memes/meme-15.jpg",
  "/memes/meme-16.jpg",
  "/memes/meme-17.jpg",
  "/memes/meme-18.jpg",
  "/memes/meme-19.jpg",
  "/memes/meme-20.jpg",
  "/memes/meme-21.jpg",
  "/memes/meme-22.jpg",
  "/memes/meme-23.jpg",
  "/memes/meme-24.jpg",
  "/memes/meme-25.jpg",
  "/memes/meme-26.jpg",
  "/memes/meme-27.jpg",
  "/memes/meme-28.jpg",
  "/memes/meme-29.jpg",
  "/memes/meme-30.jpg",
  "/memes/meme-31.jpg",
  "/memes/meme-32.jpg",
  "/memes/meme-33.jpg",
  "/memes/meme-34.jpg",
  "/memes/meme-35.jpg",
  "/memes/meme-36.jpg",
  "/memes/meme-37.jpg",
  "/memes/meme-38.jpg",
  "/memes/meme-39.jpg",
  "/memes/meme-40.jpg",
  "/memes/meme-41.jpg",
  "/memes/meme-42.jpg",
  "/memes/meme-43.jpg",
  "/memes/meme-44.jpg",
  "/memes/meme-45.jpg",
  "/memes/meme-46.webp",
];

/** The picture is the joke — never overlay extra text. */
const POOLS = {
  first: ["/memes/meme-16.jpg", "/memes/meme-12.jpg", "/memes/meme-08.jpg"],
  second: ["/memes/meme-07.jpg", "/memes/meme-09.jpg", "/memes/meme-27.jpg"],
  tooMuch: ["/memes/meme-02.webp", "/memes/meme-06.png", "/memes/meme-33.jpg"],
  chaos: ["/memes/meme-20.jpg", "/memes/meme-02.webp", "/memes/meme-06.png", "/memes/meme-33.jpg"],
  spicy: ["/memes/meme-07.jpg", "/memes/meme-40.jpg"],
  omelette: ["/memes/meme-29.jpg", "/memes/meme-44.jpg"],
  box: ["/memes/meme-17.jpg"],
  puree: ["/memes/meme-38.jpg"],
  fancy: ["/memes/meme-24.jpg"],
  moussaka: ["/memes/meme-14.jpg"],
  again: ["/memes/meme-09.jpg", "/memes/meme-16.jpg", "/memes/meme-30.jpg"],
};

const SPICY = new Set(["foul-hot", "foul-salsa", "box-hotoil", "box-tesha"]);
const OMELETTE = new Set([
  "egg-omelet", "egg-roll", "foul-omelet", "tam-omelet", "bat-omelet",
  "misc-french", "misc-egga", "egg-ched", "egg-roumi", "egg-saus", "egg-bastr", "egg-chez-tom",
]);
const PUREE = new Set(["bat-puree", "box-batpur"]);
const FANCY = new Set([
  "foul-bastr", "tam-bastr", "egg-bastr", "box-bastr",
  "tam-kiri", "tam-mozz", "bat-ched", "bat-roumi", "egg-ched", "egg-roumi",
  "egg-chez-tom", "misc-tomato", "misc-fried",
]);
const MOUSSAKA = new Set([
  "misc-mesa", "misc-mesa-mt", "misc-mesa-sg",
  "box-mesa", "box-mesa-mt", "box-mesa-sg", "box-mesa-so",
]);

function fromPool(pool, exceptSrc) {
  const list = (pool || MEMES).filter((m) => m !== exceptSrc);
  const use = list.length ? list : (pool || MEMES);
  return use[Math.floor(Math.random() * use.length)] || MEMES[0];
}

/**
 * Situation-first: type of sandwich, then how many items.
 * Returns { src, shake } with no caption.
 */
export function pickSituationMeme({ itemId, catId, count, qty, exceptSrc }) {
  let pool = MEMES;
  let shake = false;

  if (count >= 5) {
    pool = POOLS.chaos;
    shake = true;
  } else if (count >= 3) {
    pool = POOLS.tooMuch;
    shake = true;
  } else if (catId === "boxes" || (itemId && itemId.startsWith("box-"))) {
    pool = POOLS.box;
  } else if (OMELETTE.has(itemId)) {
    pool = POOLS.omelette;
  } else if (SPICY.has(itemId)) {
    pool = POOLS.spicy;
  } else if (PUREE.has(itemId)) {
    pool = POOLS.puree;
  } else if (FANCY.has(itemId)) {
    pool = POOLS.fancy;
  } else if (MOUSSAKA.has(itemId)) {
    pool = POOLS.moussaka;
  } else if (qty >= 2) {
    pool = POOLS.again;
  } else if (count === 1) {
    pool = POOLS.first;
  } else if (count === 2) {
    pool = POOLS.second;
  }

  return { src: fromPool(pool, exceptSrc), shake };
}
