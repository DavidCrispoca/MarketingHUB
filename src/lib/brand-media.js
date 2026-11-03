import { useQuery } from "@tanstack/react-query";
import { supabase } from "./supabase.js";

export function useBrandMediaAssets(brandId) {
  return useQuery({ queryKey: ["brand-media-assets", brandId], enabled: Boolean(brandId), queryFn: async () => {
    const { data, error } = await supabase.from("media_assets").select("id,name,mime_type,original_path,thumb_path").eq("brand_id", brandId).order("name");
    if (error) throw error;
    const assets = data ?? [];
    const paths = assets.map((asset) => asset.thumb_path || asset.original_path).filter(Boolean);
    let urls = {};
    if (paths.length) {
      const { data: files, error: signError } = await supabase.storage.from("brand-media").createSignedUrls(paths, 3600);
      if (signError) throw signError;
      urls = Object.fromEntries((files ?? []).filter((file) => file.signedUrl).map((file) => [file.path, file.signedUrl]));
    }
    return { assets, urls: Object.fromEntries(assets.map((asset) => [asset.id, urls[asset.thumb_path] || urls[asset.original_path]])) };
  }});
}
