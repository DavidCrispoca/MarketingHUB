import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase.js";

export const bankKey = (brandId) => ["banks", brandId];
export function useBankData(brandId) {
  return useQuery({ queryKey: bankKey(brandId), enabled: Boolean(brandId), queryFn: async () => {
    const tables = ["caption_bank", "hashtag_sets", "cta_bank", "campaigns", "network_templates"];
    const results = await Promise.all(tables.map((table) => supabase.from(table).select("*").or(table === "network_templates" ? `brand_id.eq.${brandId},brand_id.is.null` : `brand_id.eq.${brandId}`).order("created_at", { ascending: false })));
    for (const result of results) if (result.error) throw result.error;
    return Object.fromEntries(tables.map((table, index) => [table, results[index].data ?? []]));
  }});
}
export function useBankMutation(brandId) {
  const client = useQueryClient();
  return useMutation({ mutationFn: async ({ table, id, values }) => {
    const query = id ? supabase.from(table).update(values).eq("id", id) : supabase.from(table).insert({ ...values, brand_id: brandId });
    const { error } = await query;
    if (error) throw error;
  }, onSuccess: () => client.invalidateQueries({ queryKey: bankKey(brandId) }) });
}
export function useBankDelete(brandId) {
  const client = useQueryClient();
  return useMutation({ mutationFn: async ({ table, id }) => {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) throw error;
  }, onSuccess: () => client.invalidateQueries({ queryKey: bankKey(brandId) }) });
}
