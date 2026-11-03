import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase.js";
import { uploadResumable } from "../../lib/resumable-upload.js";

export const mediaKey = (brandId) => ["media", brandId];

async function fetchMedia(brandId) {
  const { data, error } = await supabase
    .from("media_assets")
    .select("*")
    .eq("brand_id", brandId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const paths = (data ?? []).flatMap(({ original_path, thumb_path }) => [original_path, thumb_path]).filter(Boolean);
  const signed = {};
  if (paths.length) {
    const { data: files, error: signError } = await supabase.storage.from("brand-media").createSignedUrls(paths, 3600);
    if (signError) throw signError;
    for (const file of files ?? []) if (file.signedUrl) signed[file.path] = file.signedUrl;
  }
  return (data ?? []).map((asset) => ({
    ...asset,
    original_url: signed[asset.original_path],
    thumb_url: signed[asset.thumb_path],
  }));
}

export function useMedia(brandId) {
  return useQuery({ queryKey: mediaKey(brandId), queryFn: () => fetchMedia(brandId), enabled: Boolean(brandId) });
}

export function useCreateMedia(brandId) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, metadata, folder, tags, onProgress }) => {
      const id = crypto.randomUUID();
      const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
      const originalPath = `${brandId}/media/${id}.${ext}`;
      let finalPath = originalPath;
      if (file.size > 6 * 1024 * 1024) finalPath = await uploadResumable(brandId, file, onProgress);
      else {
        const { error: uploadError } = await supabase.storage.from("brand-media").upload(originalPath, file, {
          cacheControl: "3600", upsert: false, contentType: file.type,
        });
        if (uploadError) throw uploadError;
      }
      let thumbPath = null;
      if (metadata.thumbnail) {
        thumbPath = `${brandId}/thumbs/${id}.jpg`;
        const { error } = await supabase.storage.from("brand-media").upload(thumbPath, metadata.thumbnail, {
          cacheControl: "3600", upsert: false, contentType: "image/jpeg",
        });
        if (error) {
          await supabase.storage.from("brand-media").remove([finalPath]);
          throw error;
        }
      }
      const { error } = await supabase.from("media_assets").insert({
        id, brand_id: brandId, name: file.name, original_path: finalPath, thumb_path: thumbPath,
        mime_type: file.type, size_bytes: file.size, width: metadata.width, height: metadata.height,
        duration_seconds: metadata.duration, folder, tags,
      });
      if (error) {
        await supabase.storage.from("brand-media").remove([finalPath, thumbPath].filter(Boolean));
        throw error;
      }
    },
    onSuccess: () => client.invalidateQueries({ queryKey: mediaKey(brandId) }),
  });
}

export function useUpdateMedia(brandId) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }) => {
      const { error } = await supabase.from("media_assets").update({ ...values, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => client.invalidateQueries({ queryKey: mediaKey(brandId) }),
  });
}

export function useDeleteMedia(brandId) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (asset) => {
      const { error } = await supabase.from("media_assets").delete().eq("id", asset.id);
      if (error) throw error;
      const { error: removeError } = await supabase.storage.from("brand-media").remove([asset.original_path, asset.thumb_path].filter(Boolean));
      if (removeError) throw removeError;
    },
    onSuccess: () => client.invalidateQueries({ queryKey: mediaKey(brandId) }),
  });
}
