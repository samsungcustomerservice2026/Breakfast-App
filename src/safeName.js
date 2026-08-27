/** Supabase Storage rejects Arabic (and most Unicode) in object names. */
const AR = {
  ا: "a", أ: "a", إ: "i", آ: "aa", ء: "", ؤ: "w", ئ: "y",
  ب: "b", ت: "t", ث: "th", ج: "g", ح: "h", خ: "kh",
  د: "d", ذ: "z", ر: "r", ز: "z", س: "s", ش: "sh",
  ص: "s", ض: "d", ط: "t", ظ: "z", ع: "a", غ: "gh",
  ف: "f", ق: "q", ك: "k", ل: "l", م: "m", ن: "n",
  ه: "h", و: "w", ي: "y", ى: "a", ة: "a",
  "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
  "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
};

export function safeStorageName(filename) {
  const raw = String(filename || "file").replace(/\\/g, "/").split("/").pop();
  const dot = raw.lastIndexOf(".");
  const ext = dot >= 0 ? raw.slice(dot).toLowerCase().replace(/jfif$/i, ".jpg") : ".jpg";
  const base = dot >= 0 ? raw.slice(0, dot) : raw;
  let slug = "";
  for (const ch of base) {
    if (AR[ch] != null) slug += AR[ch];
    else if (/[A-Za-z0-9]/.test(ch)) slug += ch.toLowerCase();
    else slug += "-";
  }
  slug = slug.replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
  return `${slug || "meme"}${ext.startsWith(".") ? ext : `.${ext}`}`;
}
