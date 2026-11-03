import { supabase } from "../../lib/supabase.js";
import { fontFormat, signBrandFiles } from "../../lib/brand-assets.js";

export { fontFormat, signBrandFiles };

// Private bucket. Nothing is public: the client only ever receives short-lived
// signed URLs, so a file of another brand cannot be opened even with the path.
export const BRAND_ASSETS_BUCKET = "brand-assets";

export const FONTS_FOLDER = "fonts";
export const LOGOS_FOLDER = "logos";

function uniqueId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// Keeps the name readable while removing anything that could break the path.
export function safeFileName(name) {
  const base = String(name ?? "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}._-]+/gu, "-")
    .replace(/^[-.]+/, "")
    .replace(/[-.]+$/, "")
    .slice(-80);
  return base || "archivo";
}

// Everything lives under "<brand_id>/<folder>/<file>", which is exactly what
// the Storage policy reads to decide whether the session may touch the object.
export async function uploadBrandFile(brandId, folder, file) {
  const path = `${brandId}/${folder}/${uniqueId()}-${safeFileName(file.name)}`;

  const { error } = await supabase.storage
    .from(BRAND_ASSETS_BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false });

  if (error) throw error;
  return path;
}

export async function removeBrandFile(path) {
  if (!path) return;
  const { error } = await supabase.storage.from(BRAND_ASSETS_BUCKET).remove([path]);
  if (error) throw error;
}

export const FONT_EXTENSIONS = [".woff2", ".woff", ".ttf", ".otf"];
export const LOGO_EXTENSIONS = [".svg", ".png", ".jpg", ".jpeg", ".webp"];

// Generous for a brand file, and low enough to catch a mistaken upload early.
export const MAX_FILE_BYTES = 5 * 1024 * 1024;

export function hasAllowedExtension(fileName, allowed) {
  const lower = String(fileName ?? "").toLowerCase();
  return allowed.some((extension) => lower.endsWith(extension));
}
