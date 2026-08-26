import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const configError =
  !url || !anon || url.includes("YOUR-PROJECT")
    ? "سوبابيس مش متظبط. انسخ .env.example لـ .env وحط اللينك والمفتاح، وبعدين شغّل السيرفر تاني."
    : null;

// Create the client even if config is missing so imports don't crash;
// App shows configError before making any calls.
export const supabase = createClient(
  url || "https://placeholder.supabase.co",
  anon || "placeholder-key"
);
