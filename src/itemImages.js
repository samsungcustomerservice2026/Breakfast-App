/** Dish photos: public/items/{itemId}.jpg
 *  To add an Egyptian-movie meme later, drop it in that folder with the same filename
 *  (e.g. public/items/foul-plain.jpg). No code change needed.
 */
export const FALLBACK_IMAGE = "/items/_fallback.jpg";

export function itemImage(id) {
  return id ? `/items/${id}.jpg` : FALLBACK_IMAGE;
}

export function onImgError(e) {
  if (e.currentTarget.dataset.fallback) return;
  e.currentTarget.dataset.fallback = "1";
  e.currentTarget.src = FALLBACK_IMAGE;
}
