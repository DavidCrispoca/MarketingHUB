import { supabase } from "./supabase.js";

export async function signBrandFiles(paths) {
  const unique = [...new Set((paths ?? []).filter(Boolean))];
  if (!unique.length) return {};
  const { data, error } = await supabase.storage.from("brand-assets").createSignedUrls(unique, 3600);
  if (error) throw error;
  return Object.fromEntries((data ?? []).filter((item) => item.signedUrl).map((item) => [item.path, item.signedUrl]));
}

export function fontFormat(path) {
  const extension = String(path ?? "").split(".").pop()?.toLowerCase();
  if (extension === "woff2") return "woff2";
  if (extension === "woff") return "woff";
  if (extension === "otf") return "opentype";
  return "truetype";
}
