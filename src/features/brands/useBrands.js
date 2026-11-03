import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase.js";
import { slugify } from "../../lib/slug.js";

export const brandsKey = ["brands"];

async function fetchBrands() {
  // RLS already limits this to the brands of the current access code.
  const { data, error } = await supabase
    .from("brands")
    .select("id, name, slug, description, created_at")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export function useBrands() {
  return useQuery({
    queryKey: brandsKey,
    queryFn: fetchBrands,
    enabled: Boolean(supabase),
  });
}

async function fetchBrand(slug) {
  const { data, error } = await supabase
    .from("brands")
    .select("id, name, slug, description, created_at")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export function useBrand(slug) {
  return useQuery({
    queryKey: ["brand", slug],
    queryFn: () => fetchBrand(slug),
    enabled: Boolean(supabase) && Boolean(slug),
  });
}

export function useCreateBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, description, accessCodeId }) => {
      const base = slugify(name) || "marca";

      // Slug is unique per access code; retry with a suffix when it is taken.
      for (let attempt = 0; attempt < 6; attempt += 1) {
        const slug = attempt === 0 ? base : `${base}-${attempt + 1}`;

        const { data, error } = await supabase
          .from("brands")
          .insert({
            name,
            slug,
            description: description || null,
            access_code_id: accessCodeId,
          })
          .select("id, name, slug, description, created_at")
          .single();

        if (!error) return data;
        if (error.code !== "23505") throw error;
      }

      throw new Error("slug_conflict");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: brandsKey }),
  });
}
