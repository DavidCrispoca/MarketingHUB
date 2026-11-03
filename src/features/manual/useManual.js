import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase.js";
import { signBrandFiles } from "./storage.js";

export const manualKey = (brandId) => ["manual", brandId];

// Mirrors the CHECK constraints in the database, so the selects never offer a
// value the server would reject.
export const COLOR_ROLES = ["primary", "secondary", "accent", "neutral", "support"];
export const FONT_ROLES = ["title", "body", "accent"];
export const GUIDELINE_SECTIONS = ["voz", "tono", "hacer", "no_hacer", "otro"];

const COLOR_COLUMNS =
  "id, brand_id, name, hex, r, g, b, cmyk, pantone, role, usage_notes, position, created_at";
const FONT_COLUMNS =
  "id, brand_id, family, role, weights, storage_path, license_notes, position, created_at";
const LOGO_COLUMNS =
  "id, brand_id, variant, storage_path, asset_id, min_size_px, clear_space_notes, position, created_at";
const GUIDELINE_COLUMNS =
  "id, brand_id, section, title, body_md, position, created_at";

async function fetchManual(brandId) {
  const [colors, fonts, logos, guidelines] = await Promise.all([
    supabase
      .from("brand_colors")
      .select(COLOR_COLUMNS)
      .eq("brand_id", brandId)
      .order("position")
      .order("created_at"),
    supabase
      .from("brand_fonts")
      .select(FONT_COLUMNS)
      .eq("brand_id", brandId)
      .order("position")
      .order("created_at"),
    supabase
      .from("brand_logos")
      .select(LOGO_COLUMNS)
      .eq("brand_id", brandId)
      .order("position")
      .order("created_at"),
    supabase
      .from("brand_guidelines")
      .select(GUIDELINE_COLUMNS)
      .eq("brand_id", brandId)
      .order("position")
      .order("created_at"),
  ]);

  // RLS already keeps other brands out; an error here is a real failure.
  for (const result of [colors, fonts, logos, guidelines]) {
    if (result.error) throw result.error;
  }

  return {
    colors: colors.data ?? [],
    fonts: fonts.data ?? [],
    logos: logos.data ?? [],
    guidelines: guidelines.data ?? [],
  };
}

// New rows go to the end of the list. Using the highest position (instead of
// the row count) keeps the values distinct after deletions, which is what makes
// swapping two positions a safe way to reorder.
export function nextPosition(rows) {
  return rows.reduce((max, row) => Math.max(max, row.position ?? 0), -1) + 1;
}

export function useManual(brandId) {
  return useQuery({
    queryKey: manualKey(brandId),
    queryFn: () => fetchManual(brandId),
    enabled: Boolean(supabase) && Boolean(brandId),
  });
}

// One mutation covers create and edit: an `id` present means update.
function useUpsert(brandId, table) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...values }) => {
      const query = id
        ? supabase.from(table).update(values).eq("id", id)
        : supabase.from(table).insert({ ...values, brand_id: brandId });

      const { data, error } = await query.select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: manualKey(brandId) }),
  });
}

function useRemove(brandId, table) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: manualKey(brandId) }),
  });
}

// Swaps the `position` of a row with its neighbour. Rows are created with
// sequential positions, so the two values always differ.
function useReorder(brandId, table) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ rows, id, direction }) => {
      const index = rows.findIndex((row) => row.id === id);
      const neighbourIndex = direction === "up" ? index - 1 : index + 1;
      if (index < 0 || neighbourIndex < 0 || neighbourIndex >= rows.length) return;

      const current = rows[index];
      const neighbour = rows[neighbourIndex];

      const first = await supabase
        .from(table)
        .update({ position: neighbour.position })
        .eq("id", current.id);
      if (first.error) throw first.error;

      const second = await supabase
        .from(table)
        .update({ position: current.position })
        .eq("id", neighbour.id);
      if (second.error) throw second.error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: manualKey(brandId) }),
  });
}

export function useManualActions(brandId) {
  return {
    saveColor: useUpsert(brandId, "brand_colors"),
    removeColor: useRemove(brandId, "brand_colors"),
    reorderColor: useReorder(brandId, "brand_colors"),
    saveFont: useUpsert(brandId, "brand_fonts"),
    removeFont: useRemove(brandId, "brand_fonts"),
    reorderFont: useReorder(brandId, "brand_fonts"),
    saveLogo: useUpsert(brandId, "brand_logos"),
    removeLogo: useRemove(brandId, "brand_logos"),
    reorderLogo: useReorder(brandId, "brand_logos"),
    saveGuideline: useUpsert(brandId, "brand_guidelines"),
    removeGuideline: useRemove(brandId, "brand_guidelines"),
    reorderGuideline: useReorder(brandId, "brand_guidelines"),
  };
}

// Signed URLs for the files of the brand. They last an hour, so the query is
// allowed to stay fresh for most of that time.
export function useSignedFiles(paths) {
  const key = useMemo(
    () => [...new Set(paths.filter(Boolean))].sort().join("|"),
    [paths],
  );

  const query = useQuery({
    queryKey: ["brand-assets", key],
    queryFn: () => signBrandFiles(key.split("|")),
    enabled: Boolean(supabase) && key.length > 0,
    staleTime: 30 * 60 * 1000,
  });

  return query.data ?? {};
}
