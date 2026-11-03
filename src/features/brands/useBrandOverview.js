import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase.js";

export function useBrandOverview(brandId) {
  return useQuery({
    queryKey: ["brand-overview", brandId],
    enabled: Boolean(supabase) && Boolean(brandId),
    queryFn: async () => {
      const queries = [
        ["colors", supabase.from("brand_colors").select("id,name,hex,role,position").eq("brand_id", brandId).order("position")],
        ["logos", supabase.from("brand_logos").select("id,variant,asset_id,storage_path,position").eq("brand_id", brandId).order("position")],
        ["captions", supabase.from("caption_bank").select("id,title,body,platform,tags").eq("brand_id", brandId).eq("status", "aprobado").order("created_at", { ascending: false })],
        ["hashtags", supabase.from("hashtag_sets").select("id,name,tags,platform").eq("brand_id", brandId).eq("status", "aprobado").order("created_at", { ascending: false })],
        ["ctas", supabase.from("cta_bank").select("id,text,platform").eq("brand_id", brandId).order("created_at", { ascending: false })],
        ["items", supabase.from("content_items").select("id,title,status,scheduled_at").eq("brand_id", brandId).order("scheduled_at")],
      ];
      const entries = await Promise.all(queries.map(async ([key, query]) => [key, await query]));
      for (const [, result] of entries) if (result.error) throw result.error;
      const result = Object.fromEntries(entries.map(([key, response]) => [key, response.data ?? []]));
      const paths = result.logos.map((logo) => logo.storage_path).filter(Boolean);
      if (paths.length) {
        const { data: files, error } = await supabase.storage.from("brand-assets").createSignedUrls(paths, 3600);
        if (error) throw error;
        result.logoUrls = Object.fromEntries((files ?? []).map((file) => [file.path, file.signedUrl]));
      }
      return result;
    },
  });
}
