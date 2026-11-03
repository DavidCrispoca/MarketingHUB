import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase.js";

export const socialKey = (brandId) => ["social", brandId];
export function useSocial(brandId) {
  return useQuery({ queryKey: socialKey(brandId), enabled: Boolean(brandId), queryFn: async () => {
    const results = await Promise.all([
      supabase.from("social_accounts").select("*").eq("brand_id", brandId).order("created_at"),
      supabase.from("account_metrics_daily").select("*").eq("brand_id", brandId).order("metric_date"),
      supabase.from("post_metrics_snapshots").select("*").eq("brand_id", brandId).order("published_at", { ascending: false }),
      supabase.from("content_items").select("id,title,scheduled_at,status").eq("brand_id", brandId).order("scheduled_at", { ascending: false }),
    ]);
    for (const result of results) if (result.error) throw result.error;
    return { accounts: results[0].data ?? [], daily: results[1].data ?? [], posts: results[2].data ?? [], items: results[3].data ?? [] };
  }});
}
export function useSocialMutation(brandId) {
  const client = useQueryClient();
  return useMutation({ mutationFn: async ({ table, values, upsert = false }) => {
    const query = upsert ? supabase.from(table).upsert({ ...values, brand_id: brandId }) : supabase.from(table).insert({ ...values, brand_id: brandId });
    const { error } = await query;
    if (error) throw error;
  }, onSuccess: () => client.invalidateQueries({ queryKey: socialKey(brandId) }) });
}
export function useDeleteSocialAccount(brandId) {
  const client = useQueryClient();
  return useMutation({ mutationFn: async (id) => {
    const { error } = await supabase.from("social_accounts").delete().eq("id", id);
    if (error) throw error;
  }, onSuccess: () => client.invalidateQueries({ queryKey: socialKey(brandId) }) });
}
