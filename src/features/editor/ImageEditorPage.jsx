import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useOutletContext, useParams } from "react-router-dom";
import { useI18n } from "../../i18n/index.jsx";
import { signBrandFiles } from "../../lib/brand-assets.js";
import { supabase } from "../../lib/supabase.js";
import { BrandFontStyles, fontFamilyAlias } from "../../components/BrandFontStyles.jsx";
import { useCreateMedia, useMedia } from "../media/useMedia.js";
import "./editor.css";

const MAX_EDGE = 4096;
const EMPTY_ROWS = [];

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });
}

export default function ImageEditorPage() {
  const { t } = useI18n(); const brand = useOutletContext(); const { assetId } = useParams();
  const { data: assets = [], isPending, isError } = useMedia(brand.id);
  const { data: identity } = useQuery({ queryKey: ["editor-brand-identity", brand.id], enabled: Boolean(brand.id), queryFn: async () => {
    const [colorsResult, fontsResult] = await Promise.all([
      supabase.from("brand_colors").select("id,hex").eq("brand_id", brand.id).order("position"),
      supabase.from("brand_fonts").select("id,family,weights,storage_path").eq("brand_id", brand.id).order("position"),
    ]);
    if (colorsResult.error) throw colorsResult.error; if (fontsResult.error) throw fontsResult.error;
    const fonts = fontsResult.data ?? [];
    return { colors: colorsResult.data ?? [], fonts, urls: await signBrandFiles(fonts.map((font) => font.storage_path)) };
  }});
  const createMedia = useCreateMedia(brand.id);
  const canvasRef = useRef(null);
  const [brightness, setBrightness] = useState(100); const [contrast, setContrast] = useState(100); const [saturation, setSaturation] = useState(100);
  const [rotation, setRotation] = useState(0); const [crop, setCrop] = useState(100); const [error, setError] = useState(""); const [saved, setSaved] = useState(false);
  const [overlay, setOverlay] = useState(""); const [overlayColor, setOverlayColor] = useState("#ffffff"); const [fontId, setFontId] = useState("");
  const asset = assets.find((item) => item.id === assetId);
  const fonts = identity?.fonts ?? EMPTY_ROWS; const colors = identity?.colors ?? EMPTY_ROWS;
  const fontUrls = identity?.urls ?? {};

  useEffect(() => {
    let active = true;
    async function render() {
      if (!asset?.original_url || asset.mime_type.startsWith("video/")) return;
      try {
        const image = await loadImage(asset.original_url);
        if (!active) return;
        const scale = Math.min(1, MAX_EDGE / image.naturalWidth, MAX_EDGE / image.naturalHeight);
        const sourceWidth = Math.max(1, Math.floor(image.naturalWidth * scale));
        const sourceHeight = Math.max(1, Math.floor(image.naturalHeight * scale));
        const cropWidth = Math.max(1, Math.floor(sourceWidth * crop / 100));
        const cropHeight = Math.max(1, Math.floor(sourceHeight * crop / 100));
        const canvas = canvasRef.current;
        canvas.width = rotation % 180 ? cropHeight : cropWidth;
        canvas.height = rotation % 180 ? cropWidth : cropHeight;
        const context = canvas.getContext("2d");
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.save(); context.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
        context.translate(canvas.width / 2, canvas.height / 2); context.rotate(rotation * Math.PI / 180);
        context.drawImage(image, Math.floor((sourceWidth-cropWidth)/2) / scale, Math.floor((sourceHeight-cropHeight)/2) / scale, cropWidth / scale, cropHeight / scale, -cropWidth/2, -cropHeight/2, cropWidth, cropHeight);
        if (overlay.trim()) {
          const font = fonts.find((entry) => entry.id === fontId);
          context.rotate(-rotation * Math.PI / 180); context.translate(-canvas.width / 2, -canvas.height / 2);
          const size = Math.max(20, Math.round(Math.min(canvas.width,canvas.height) * 0.065));
          context.font = `600 ${size}px "${font ? fontFamilyAlias(font) : "sans-serif"}"`;
          context.textAlign = "left"; context.textBaseline = "bottom"; context.fillStyle = overlayColor; context.shadowColor = "#0009"; context.shadowBlur = 5;
          const words = overlay.split(/\s+/); const lines = []; let line = "";
          for (const word of words) { const candidate = line ? `${line} ${word}` : word; if (line && context.measureText(candidate).width > canvas.width * 0.9) { lines.push(line); line = word; } else line = candidate; }
          if (line) lines.push(line);
          lines.slice(-4).forEach((text, index, all) => context.fillText(text, canvas.width * 0.05, canvas.height * 0.94 - (all.length - index - 1) * (size * 1.2), canvas.width * 0.9));
        }
        context.restore();
      } catch { if (active) setError(t("editor.previewError")); }
    }
    void render(); return () => { active = false; };
  }, [asset?.original_url, asset?.mime_type, brightness, contrast, saturation, rotation, crop, overlay, overlayColor, fontId, fonts, t]);

  async function exportCopy() {
    setError(""); setSaved(false);
    try {
      const canvas = canvasRef.current;
      const mime = asset.mime_type === "image/png" ? "image/png" : "image/jpeg";
      const blob = await new Promise((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("export")), mime, 0.92));
      const extension = mime === "image/png" ? "png" : "jpg";
      const baseName = asset.name.replace(/\.[^.]+$/, "");
      const file = new File([blob], `${baseName}-editada.${extension}`, { type: mime });
      const thumbCanvas = document.createElement("canvas");
      const ratio = Math.min(1, 480 / Math.max(canvas.width, canvas.height));
      thumbCanvas.width = Math.max(1, Math.round(canvas.width * ratio)); thumbCanvas.height = Math.max(1, Math.round(canvas.height * ratio));
      thumbCanvas.getContext("2d").drawImage(canvas, 0, 0, thumbCanvas.width, thumbCanvas.height);
      const thumbnail = await new Promise((resolve) => thumbCanvas.toBlob(resolve, "image/jpeg", 0.78));
      await createMedia.mutateAsync({ file, metadata: { width: canvas.width, height: canvas.height, duration: null, thumbnail }, folder: asset.folder, tags: asset.tags });
      setSaved(true);
    } catch (cause) { setError(cause.message || t("editor.saveError")); }
  }

  if (isPending) return <p className="state">{t("state.loading")}</p>;
  if (isError || !asset || asset.mime_type.startsWith("video/")) return <div className="state"><p>{t("editor.unavailable")}</p><Link className="btn btn--ghost" to={`/m/${brand.slug}/medios`}>{t("editor.back")}</Link></div>;

  return <section className="editor">
    <BrandFontStyles fonts={fonts} urls={fontUrls} />
    <header className="editor__head"><div><p className="label-caps">{t("editor.label")}</p><h2>{t("editor.title")}</h2><p>{asset.name}</p></div><Link className="btn btn--ghost" to={`/m/${brand.slug}/medios`}>{t("editor.back")}</Link></header>
    <div className="editor__workspace"><div className="editor__canvas-wrap"><canvas ref={canvasRef} aria-label={t("editor.preview")} /><span>{t("editor.resolutionNotice", { edge: MAX_EDGE })}</span></div>
      <div className="editor__controls"><h3>{t("editor.adjustments")}</h3>
        {[["brightness",brightness,setBrightness],["contrast",contrast,setContrast],["saturation",saturation,setSaturation]].map(([key,value,setter]) => <label key={key}>{t(`editor.${key}`)} <output>{value}%</output><input type="range" min="0" max="200" value={value} onChange={(event) => setter(Number(event.target.value))} /></label>)}
        <label>{t("editor.crop")} <output>{crop}%</output><input type="range" min="40" max="100" value={crop} onChange={(event) => setCrop(Number(event.target.value))} /></label>
        <label>{t("editor.overlay")}<textarea maxLength={100} value={overlay} onChange={(event) => setOverlay(event.target.value)} /></label>
        <div className="editor__row"><label>{t("editor.overlayColor")}<select value={overlayColor} onChange={(event) => setOverlayColor(event.target.value)}>{["#ffffff", "#111111", ...colors.map((color) => color.hex)].map((hex) => <option key={hex} value={hex}>{hex}</option>)}</select></label><label>{t("editor.font")}<select value={fontId} onChange={(event) => setFontId(event.target.value)}><option value="">{t("editor.fontDefault")}</option>{fonts.map((font) => <option key={font.id} value={font.id}>{font.family}</option>)}</select></label></div>
        <div className="editor__rotate"><span>{t("editor.rotation")}</span><button className="btn btn--ghost" onClick={() => setRotation((rotation + 270) % 360)}>{t("editor.rotateLeft")}</button><button className="btn btn--ghost" onClick={() => setRotation((rotation + 90) % 360)}>{t("editor.rotateRight")}</button></div>
        <button className="btn btn--primary" disabled={createMedia.isPending} onClick={() => void exportCopy()}>{createMedia.isPending ? t("editor.saving") : t("editor.saveCopy")}</button>
        {saved && <p className="editor__success" role="status">{t("editor.saved")}</p>}{error && <p className="editor__error" role="alert">{error}</p>}
      </div>
    </div>
  </section>;
}
