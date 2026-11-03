import { supabase } from "./supabase.js";

const CHUNK_BYTES = 6 * 1024 * 1024;
const RETRIES = [0, 1500, 4000, 9000, 16000];

function base64(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function resumableEndpoint() {
  const url = new URL(supabase.supabaseUrl);
  if (url.hostname.endsWith(".supabase.co") && !url.hostname.endsWith(".storage.supabase.co")) {
    url.hostname = url.hostname.replace(/\.supabase\.co$/, ".storage.supabase.co");
  }
  return `${url.origin}/storage/v1/upload/resumable`;
}

async function createUpload(endpoint, path, file, accessToken) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "Tus-Resumable": "1.0.0",
      "Upload-Length": String(file.size),
      "Upload-Metadata": [
        ["bucketName", "brand-media"],
        ["objectName", path],
        ["contentType", file.type || "application/octet-stream"],
        ["cacheControl", "3600"],
      ].map(([key, value]) => `${key} ${base64(value)}`).join(","),
      "x-upsert": "false",
    },
  });
  if (!response.ok) throw new Error(`Upload creation failed (${response.status})`);
  const location = response.headers.get("Location");
  if (!location) throw new Error("Upload service did not return a resumable URL");
  return new URL(location, endpoint).href;
}

async function readOffset(url, accessToken) {
  const response = await fetch(url, { method: "HEAD", headers: { authorization: `Bearer ${accessToken}`, "Tus-Resumable": "1.0.0", "Cache-Control": "no-store" } });
  if (!response.ok) { const error = new Error(`Upload resume failed (${response.status})`); error.status = response.status; throw error; }
  return Number(response.headers.get("Upload-Offset") || 0);
}

async function patchChunk(url, file, offset, accessToken) {
  const end = Math.min(offset + CHUNK_BYTES, file.size);
  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "Tus-Resumable": "1.0.0",
      "Upload-Offset": String(offset),
      "Content-Type": "application/offset+octet-stream",
    },
    body: file.slice(offset, end),
  });
  if (!response.ok) throw new Error(`Upload chunk failed (${response.status})`);
  return Number(response.headers.get("Upload-Offset") || end);
}

export async function uploadResumable(brandId, file, onProgress = () => {}) {
  if (supabase.isLocal) {
    const path = `${brandId}/media/${crypto.randomUUID()}.${file.name.split(".").pop()?.toLowerCase() || "bin"}`;
    const { error } = await supabase.storage.from("brand-media").upload(path, file, { upsert: false, contentType: file.type });
    if (error) throw error;
    onProgress(100);
    return path;
  }
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("A signed-in session is required to upload media");
  const fingerprint = `${session.user.id}:${brandId}:${file.name}:${file.size}:${file.lastModified}`;
  const storageKey = `mhub-tus:${await crypto.subtle.digest("SHA-256", new TextEncoder().encode(fingerprint)).then((hash) => [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2,"0")).join(""))}`;
  let saved;
  try { saved = JSON.parse(localStorage.getItem(storageKey) || "null"); } catch { saved = null; }
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = saved?.path || `${brandId}/media/${crypto.randomUUID()}.${ext}`;
  const endpoint = resumableEndpoint();
  let uploadUrl = saved?.url;
  if (uploadUrl) {
    try { await readOffset(uploadUrl, session.access_token); }
    catch (error) {
      if (![404, 410].includes(error.status)) throw error;
      uploadUrl = null; localStorage.removeItem(storageKey);
    }
  }
  if (!uploadUrl) {
    uploadUrl = await createUpload(endpoint, path, file, session.access_token);
    localStorage.setItem(storageKey, JSON.stringify({ path, url: uploadUrl }));
  }

  let offset = await readOffset(uploadUrl, session.access_token);
  onProgress(Math.min(100, Math.round(offset / file.size * 100)));
  while (offset < file.size) {
    let uploaded = false;
    let lastError;
    for (const delay of RETRIES) {
      if (delay) await new Promise((resolve) => window.setTimeout(resolve, delay));
      try {
        offset = await patchChunk(uploadUrl, file, offset, session.access_token);
        uploaded = true;
        onProgress(Math.min(100, Math.round(offset / file.size * 100)));
        break;
      } catch (error) {
        lastError = error;
        try {
          offset = await readOffset(uploadUrl, session.access_token);
          onProgress(Math.min(100, Math.round(offset / file.size * 100)));
          if (offset >= file.size) { uploaded = true; break; }
        } catch (resumeError) { lastError = resumeError; }
      }
    }
    if (!uploaded) throw lastError || new Error("Upload could not be resumed");
  }
  localStorage.removeItem(storageKey);
  return path;
}
