import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase.js";

export function useMediaComments(assetId) {
  return useQuery({
    queryKey: ["media-comments", assetId],
    enabled: Boolean(assetId),
    queryFn: async () => {
      const { data, error } = await supabase.from("media_comments").select("*").eq("asset_id", assetId).order("created_at");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateMediaComment(asset) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (values) => {
      const { error } = await supabase.from("media_comments").insert({ ...values, brand_id: asset.brand_id, asset_id: asset.id });
      if (error) throw error;
    },
    onSuccess: () => client.invalidateQueries({ queryKey: ["media-comments", asset.id] }),
  });
}

export function useUpdateMediaComment(assetId) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }) => {
      const { error } = await supabase.from("media_comments").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => client.invalidateQueries({ queryKey: ["media-comments", assetId] }),
  });
}
