import { useMemo, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { useRef } from "react";
import { useI18n } from "../../i18n/index.jsx";
import Section from "../../components/Section.jsx";
import { useAuth } from "../auth/AuthProvider.jsx";
import { mediaFileSchema } from "../../lib/schemas.js";
import { useCreateMedia, useDeleteMedia, useMedia, useUpdateMedia } from "./useMedia.js";
import { useCreateMediaComment, useMediaComments, useUpdateMediaComment } from "./useMediaComments.js";
import "./media.css";

const MAX_BYTES = 100 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm";

function readMetadata(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = file.type.startsWith("video/");
    const media = video ? document.createElement("video") : new Image();
    media.preload = "metadata";
    media.onloadedmetadata = async () => {
      const width = media.videoWidth || media.naturalWidth;
      const height = media.videoHeight || media.naturalHeight;
      const duration = video && Number.isFinite(media.duration) ? media.duration : null;
      let thumbnail = null;
      try {
        if (video) {
          await new Promise((done) => {
            media.addEventListener("seeked", done, { once: true });
            media.addEventListener("error", done, { once: true });
            media.currentTime = Math.min(1, duration || 0);
          });
        }
        const canvas = document.createElement("canvas");
        const ratio = Math.min(1, 480 / Math.max(width, height));
        canvas.width = Math.max(1, Math.round(width * ratio));
        canvas.height = Math.max(1, Math.round(height * ratio));
        canvas.getContext("2d")?.drawImage(media, 0, 0, canvas.width, canvas.height);
        thumbnail = await new Promise((done) => canvas.toBlob(done, "image/jpeg", 0.78));
      } catch { /* Some codecs do not allow a browser thumbnail. */ }
      URL.revokeObjectURL(url);
      resolve({ width: width || null, height: height || null, duration, thumbnail });
    };
    media.onerror = () => { URL.revokeObjectURL(url); resolve({ width: null, height: null, duration: null, thumbnail: null }); };
    if (video) media.src = url;
    else media.src = url;
  });
}

function formatSize(bytes) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`;
}

export default function MediaPage() {
  const { t } = useI18n();
  const { grant } = useAuth();
  const brand = useOutletContext();
  const { data: assets = [], isPending, isError, refetch } = useMedia(brand.id);
  const create = useCreateMedia(brand.id);
  const update = useUpdateMedia(brand.id);
  const remove = useDeleteMedia(brand.id);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [kind, setKind] = useState("all");
  const [folder, setFolder] = useState("");
  const [tags, setTags] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadingName, setUploadingName] = useState("");
  const [selected, setSelected] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [pinMode, setPinMode] = useState(false);
  const [commentFilter, setCommentFilter] = useState("pending");
  const videoRef = useRef(null);
  const { data: comments = [] } = useMediaComments(selected?.id);
  const addComment = useCreateMediaComment(selected);
  const updateComment = useUpdateMediaComment(selected?.id);
  const folders = [...new Set(assets.map((asset) => asset.folder).filter(Boolean))];
  const visible = useMemo(() => assets.filter((asset) =>
    (status === "all" || asset.status === status)
    && (kind === "all" || (kind === "video") === asset.mime_type.startsWith("video/"))
    && (!query || `${asset.name} ${asset.folder} ${asset.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase()))
    && (!folder || asset.folder === folder)), [assets, folder, kind, query, status]);

  async function uploadFiles(event) {
    const files = [...(event.target.files ?? [])];
    event.target.value = "";
    setError("");
    setBusy(true);
    try {
      for (const file of files) {
        const validFile = mediaFileSchema.safeParse(file);
        if (!validFile.success) { setError(file.size > MAX_BYTES ? t("media.error.size", { name: file.name }) : t("media.error.type")); return; }
        setProgress(0); setUploadingName(file.name);
        const metadata = await readMetadata(file);
        await create.mutateAsync({ file, metadata, folder: folder.trim(), tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean), onProgress: setProgress });
        setProgress(100);
      }
    } catch {
      setError(t("media.error.upload"));
    } finally { setBusy(false); }
  }

  async function submitComment(extra = {}) {
    if (!commentText.trim() || !selected) return;
    try {
      await addComment.mutateAsync({ author_name: grant?.holder_name || "Equipo", body: commentText.trim(), parent_id: replyTo, ...extra });
      setCommentText(""); setReplyTo(null); setPinMode(false);
    } catch (cause) { setError(cause.message || t("media.comments.error")); }
  }

  function placePin(event) {
    if (!pinMode || !commentText.trim()) return;
    const rect = event.currentTarget.getBoundingClientRect();
    void submitComment({ pos_x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)), pos_y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)) });
  }

  return (
    <section className="media">
      <header className="media__head">
        <div><p className="label-caps">{t("media.label")}</p><h2>{t("media.title")}</h2><p>{t("media.lead")}</p></div>
        <label className={`btn btn--primary media__upload${busy ? " is-disabled" : ""}`}>
          {busy ? t("media.uploading") : t("media.upload")}
          <input type="file" accept={ACCEPT} multiple disabled={busy} onChange={uploadFiles} />
        </label>
      </header>

      <Section
        eyebrow={t("media.label")}
        title={t("media.section.upload")}
        description={t("media.section.upload.hint")}
      >
        <div className="media__upload-options">
          <label>{t("media.folder")}<input value={folder} onChange={(event) => setFolder(event.target.value)} placeholder={t("media.folder.placeholder")} /></label>
          <label>{t("media.tags")}<input value={tags} onChange={(event) => setTags(event.target.value)} placeholder={t("media.tags.placeholder")} /></label>
        </div>
        <p className="media__hint">{t("media.uploadHint")}</p>
        {busy && <p className="media__progress" role="status">{t("media.uploadProgress", { name: uploadingName, progress })}<progress max="100" value={progress} /></p>}
        {error && <p className="media__error" role="alert">{error}</p>}
      </Section>

      <Section
        eyebrow={t("media.label")}
        title={t("media.section.library")}
        description={t("media.section.library.hint")}
        defaultOpen
      >
        <div className="media__filters">
          <label className="media__search">{t("media.search")}<input value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          <label>{t("media.status")}<select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">{t("media.filter.all")}</option>{["pendiente", "en_uso", "usado", "archivado"].map((value) => <option key={value} value={value}>{t(`media.status.${value}`)}</option>)}
          </select></label>
          <label>{t("media.kind")}<select value={kind} onChange={(event) => setKind(event.target.value)}><option value="all">{t("media.filter.all")}</option><option value="image">{t("media.kind.image")}</option><option value="video">{t("media.kind.video")}</option></select></label>
          <label>{t("media.folder")}<select value={folder === "" || folders.includes(folder) ? folder : ""} onChange={(event) => setFolder(event.target.value)}><option value="">{t("media.filter.all")}</option>{folders.map((value) => <option key={value}>{value}</option>)}</select></label>
        </div>

        {isPending ? <p className="state" role="status">{t("state.loading")}</p> : isError ? <div className="state" role="alert"><p>{t("state.error")}</p><button className="btn btn--ghost" onClick={() => refetch()}>{t("state.retry")}</button></div> : visible.length === 0 ? <p className="media__empty">{assets.length ? t("media.emptyFiltered") : t("media.empty")}</p> : (
          <div className="media__grid">{visible.map((asset) => <article className="media__card" key={asset.id}>
            <button className="media__preview" onClick={() => setSelected(asset)} aria-label={t("media.open", { name: asset.name })}>
              {asset.thumb_url ? <img src={asset.thumb_url} alt="" loading="lazy" /> : <span>{asset.mime_type.startsWith("video/") ? "▶" : "▧"}</span>}
              {asset.mime_type.startsWith("video/") && <b>▶</b>}
            </button>
            <div className="media__card-body"><strong title={asset.name}>{asset.name}</strong><span>{formatSize(asset.size_bytes)} · {asset.width && asset.height ? `${asset.width} × ${asset.height}` : t("media.metadata.unknown")}</span>
              <div className="media__tags">{asset.folder && <span>{asset.folder}</span>}{asset.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div>
              <select aria-label={t("media.status")} value={asset.status} onChange={(event) => update.mutate({ id: asset.id, status: event.target.value })}>{["pendiente", "en_uso", "usado", "archivado"].map((value) => <option key={value} value={value}>{t(`media.status.${value}`)}</option>)}</select>
            </div>
          </article>)}</div>
        )}
      </Section>

      {selected && <div className="media__dialog-backdrop" role="presentation" onClick={() => setSelected(null)}><section className="media__dialog" role="dialog" aria-modal="true" aria-label={selected.name} onClick={(event) => event.stopPropagation()}>
        <button className="media__close" onClick={() => setSelected(null)} aria-label={t("media.close")}>×</button>
        {selected.mime_type.startsWith("video/") ? <video ref={videoRef} src={selected.original_url} controls /> : <div className={`media__annotated${pinMode ? " is-pinning" : ""}`} onClick={placePin}>
          <img src={selected.original_url} alt={selected.name} />
          {comments.filter((comment) => comment.pos_x != null).map((comment, index) => <button className="media__pin" key={comment.id} style={{ left: `${comment.pos_x * 100}%`, top: `${comment.pos_y * 100}%` }} title={comment.body} aria-label={t("media.comments.pin", { number: index + 1 })} onClick={(event) => { event.stopPropagation(); document.getElementById(`media-comment-${comment.id}`)?.scrollIntoView({ block: "center" }); }}>{index + 1}</button>)}
        </div>}
        <h3>{selected.name}</h3><p>{formatSize(selected.size_bytes)} · {selected.width && selected.height ? `${selected.width} × ${selected.height}` : t("media.metadata.unknown")}{selected.duration_seconds ? ` · ${Math.round(selected.duration_seconds)} s` : ""}</p>
        <a className="btn btn--ghost" href={selected.original_url} download={selected.name}>{t("media.download")}</a>
        {!selected.mime_type.startsWith("video/") && <Link className="btn btn--ghost" to={`/m/${brand.slug}/editor/${selected.id}`}>{t("media.editImage")}</Link>}
        <section className="media__comments">
          <h3>{t("media.comments.title")}</h3>
          <label className="media__comment-filter">{t("media.comments.filter")}<select value={commentFilter} onChange={(event) => setCommentFilter(event.target.value)}><option value="pending">{t("media.comments.pending")}</option><option value="resolved">{t("media.comments.resolved")}</option><option value="all">{t("media.filter.all")}</option></select></label>
          <label className="media__comment-input">{t(replyTo ? "media.comments.replying" : "media.comments.write")}
            <textarea value={commentText} maxLength={4000} onChange={(event) => setCommentText(event.target.value)} />
          </label>
          <div className="media__comment-actions">
            {!selected.mime_type.startsWith("video/") && <button className="btn btn--ghost" type="button" onClick={() => setPinMode(!pinMode)}>{pinMode ? t("media.comments.pinPrompt") : t("media.comments.addPin")}</button>}
            {selected.mime_type.startsWith("video/") && <button className="btn btn--ghost" type="button" onClick={() => void submitComment({ video_time_seconds: videoRef.current?.currentTime ?? 0 })}>{t("media.comments.addAtTime")}</button>}
            <button className="btn btn--primary" type="button" disabled={!commentText.trim() || pinMode || addComment.isPending} onClick={() => void submitComment()}>{t("media.comments.send")}</button>
          </div>
          {comments.filter((comment) => !comment.parent_id && (commentFilter === "all" || comment.resolved === (commentFilter === "resolved"))).map((comment, index) => <article className={`media__comment${comment.resolved ? " is-resolved" : ""}`} id={`media-comment-${comment.id}`} key={comment.id}>
            <header><strong>{comment.pos_x != null ? `#${index + 1} · ` : ""}{comment.author_name}</strong><time>{new Date(comment.created_at).toLocaleString("es-CO")}</time></header>
            <p>{comment.body}</p>
            {comment.video_time_seconds != null && <button className="media__time-link" onClick={() => { if (videoRef.current) { videoRef.current.currentTime = comment.video_time_seconds; videoRef.current.play(); } }}>{Math.floor(comment.video_time_seconds / 60)}:{String(Math.floor(comment.video_time_seconds % 60)).padStart(2, "0")}</button>}
            {comments.filter((reply) => reply.parent_id === comment.id).map((reply) => <div className="media__reply" key={reply.id}><strong>{reply.author_name}</strong><p>{reply.body}</p></div>)}
            <footer><button onClick={() => { setReplyTo(comment.id); document.querySelector(".media__comment-input textarea")?.focus(); }}>{t("media.comments.reply")}</button><button onClick={() => updateComment.mutate({ id: comment.id, resolved: !comment.resolved })}>{t(comment.resolved ? "media.comments.reopen" : "media.comments.resolve")}</button></footer>
          </article>)}
        </section>
        <button className="btn btn--danger" onClick={async () => { if (confirm(t("media.delete.confirm", { name: selected.name }))) { try { await remove.mutateAsync(selected); setSelected(null); } catch (cause) { setError(cause.message || t("media.error.delete")); } } }}>{t("media.delete")}</button>
      </section></div>}
    </section>
  );
}
