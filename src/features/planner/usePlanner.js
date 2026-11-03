import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase.js";

export const plannerKey = (brandId) => ["planner", brandId];
export function usePlanner(brandId) {
  return useQuery({ queryKey: plannerKey(brandId), enabled: Boolean(brandId), queryFn: async () => {
    const tables = [
      ["items", supabase.from("content_items").select("*").eq("brand_id", brandId).order("scheduled_at")],
      ["campaigns", supabase.from("campaigns").select("*").eq("brand_id", brandId).order("start_date")],
      ["assets", supabase.from("media_assets").select("id,name,thumb_path,original_path,mime_type").eq("brand_id", brandId)],
      ["reminders", supabase.from("reminders").select("*").eq("brand_id", brandId).order("remind_at")],
      ["targets", supabase.from("content_item_targets").select("*").eq("brand_id", brandId)],
      ["links", supabase.from("content_item_assets").select("*").eq("brand_id", brandId)],
      ["history", supabase.from("content_status_history").select("*").eq("brand_id", brandId).order("created_at", { ascending: false })],
      ["comments", supabase.from("content_comments").select("*").eq("brand_id", brandId).order("created_at")],
      ["captions", supabase.from("caption_bank").select("id,title,body,tags,platform").eq("brand_id", brandId).eq("status", "aprobado").order("title")],
      ["hashtags", supabase.from("hashtag_sets").select("id,name,tags,platform").eq("brand_id", brandId).eq("status", "aprobado").order("name")],
      ["ctas", supabase.from("cta_bank").select("id,text,platform").eq("brand_id", brandId).eq("status", "aprobado").order("created_at")],
      ["templates", supabase.from("network_templates").select("id,brand_id,platform,name,width,height,max_caption,max_hashtags").or(`brand_id.eq.${brandId},brand_id.is.null`).order("name")],
    ];
    const entries = await Promise.all(tables.map(async ([key, query]) => [key, await query]));
    for (const [, result] of entries) if (result.error) throw result.error;
    const data = Object.fromEntries(entries.map(([key, result]) => [key, result.data ?? []]));
    const paths = data.assets.flatMap((asset) => [asset.thumb_path, asset.original_path]).filter(Boolean);
    if (paths.length) {
      const { data: files, error } = await supabase.storage.from("brand-media").createSignedUrls(paths, 3600);
      if (error) throw error;
      const urls = Object.fromEntries((files ?? []).map((file) => [file.path, file.signedUrl]));
      data.assets = data.assets.map((asset) => ({ ...asset, preview_url: urls[asset.thumb_path] || urls[asset.original_path] }));
    }
    return data;
  }});
}

export function useCreateContent(brandId) {
  const client = useQueryClient();
  return useMutation({ mutationFn: async ({ item, platforms, assetIds }) => {
    const { data, error } = await supabase.from("content_items").insert({ ...item, brand_id: brandId }).select("id").single();
    if (error) throw error;
    try {
      if (platforms.length) {
        const { error: targetError } = await supabase.from("content_item_targets").insert(platforms.map((target) => ({ brand_id: brandId, content_item_id: data.id, platform: typeof target === "string" ? target : target.platform, template_id: typeof target === "string" ? null : target.template_id, caption_override: "" })));
        if (targetError) throw targetError;
      }
      if (assetIds.length) {
        const { error: assetError } = await supabase.from("content_item_assets").insert(assetIds.map((asset_id, position) => ({ brand_id: brandId, content_item_id: data.id, asset_id, position })));
        if (assetError) throw assetError;
      }
    } catch (cause) {
      await supabase.from("content_items").delete().eq("id", data.id);
      throw cause;
    }
  }, onSuccess: () => client.invalidateQueries({ queryKey: plannerKey(brandId) }) });
}

export function useUpdateContent(brandId) {
  const client = useQueryClient();
  return useMutation({ mutationFn: async ({ id, ...values }) => {
    const { error } = await supabase.from("content_items").update({ ...values, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) throw error;
  }, onSuccess: () => client.invalidateQueries({ queryKey: plannerKey(brandId) }) });
}

export function useDeleteContent(brandId) {
  const client = useQueryClient();
  return useMutation({ mutationFn: async (id) => {
    const { error } = await supabase.from("content_items").delete().eq("id", id);
    if (error) throw error;
  }, onSuccess: () => client.invalidateQueries({ queryKey: plannerKey(brandId) }) });
}

export function useTransitionContent(brandId) {
  const client = useQueryClient();
  return useMutation({ mutationFn: async ({ itemId, status, comment = "" }) => {
    const { error } = await supabase.rpc("transition_content_item", { p_item_id: itemId, p_to_status: status, p_comment: comment });
    if (error) throw error;
  }, onSuccess: () => client.invalidateQueries({ queryKey: plannerKey(brandId) }) });
}

export function useSaveReminder(brandId) {
  const client = useQueryClient();
  return useMutation({ mutationFn: async ({ id, ...values }) => {
    const query = id ? supabase.from("reminders").update(values).eq("id", id) : supabase.from("reminders").insert({ ...values, brand_id: brandId });
    const { error } = await query;
    if (error) throw error;
  }, onSuccess: () => client.invalidateQueries({ queryKey: plannerKey(brandId) }) });
}

export function useDeleteReminder(brandId) {
  const client = useQueryClient();
  return useMutation({ mutationFn: async (id) => {
    const { error } = await supabase.from("reminders").delete().eq("id", id);
    if (error) throw error;
  }, onSuccess: () => client.invalidateQueries({ queryKey: plannerKey(brandId) }) });
}

export function useAddContentComment(brandId) {
  const client = useQueryClient();
  return useMutation({ mutationFn: async (values) => {
    const { error } = await supabase.from("content_comments").insert({ ...values, brand_id: brandId });
    if (error) throw error;
  }, onSuccess: () => client.invalidateQueries({ queryKey: plannerKey(brandId) }) });
}
