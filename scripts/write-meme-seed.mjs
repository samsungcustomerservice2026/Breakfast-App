import { readFileSync, writeFileSync } from "fs";

const rows = JSON.parse(readFileSync("supabase/meme_files_seed.json", "utf8"));
const esc = (s) => String(s).replace(/'/g, "''");
const values = rows.map(
  (r) => `  ('${esc(r.situation)}', '${esc(r.path)}', '${esc(r.original_name)}', ${r.sort})`
).join(",\n");
const sql = `delete from public.meme_files;
insert into public.meme_files (situation, path, original_name, sort) values
${values}
on conflict (situation, path) do update set original_name = excluded.original_name, sort = excluded.sort;
`;
writeFileSync("supabase/memes_seed.sql", sql);
console.log("wrote", rows.length, "rows");
