import { Link, useOutletContext } from "react-router-dom";
import Section from "../../components/Section.jsx";
import { useI18n } from "../../i18n/index.jsx";
import { useBrandMediaAssets } from "../../lib/brand-media.js";
import { useBrandOverview } from "./useBrandOverview.js";
import "./brands.css";

function publicationDate(value) {
  if (!value) return null;
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Bogota" }).format(new Date(value));
}

export default function BrandHome() {
  const { t } = useI18n();
  const brand = useOutletContext();
  const { data, isPending } = useBrandOverview(brand.id);
  const media = useBrandMediaAssets(brand.id);
  const colors = data?.colors ?? [];
  const logos = data?.logos ?? [];
  const assets = media.data?.assets ?? [];
  const urls = media.data?.urls ?? {};
  const logoIds = new Set(logos.map((logo) => logo.asset_id).filter(Boolean));
  const gallery = assets.filter((asset) => !logoIds.has(asset.id)).slice(0, 5);
  const captions = data?.captions ?? [];
  const hashtags = data?.hashtags ?? [];
  const ctas = data?.ctas ?? [];
  const items = data?.items ?? [];
  const nextItem = items.filter((item) => item.scheduled_at && new Date(item.scheduled_at) >= new Date() && item.status !== "publicado").sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))[0];
  const activeItems = items.filter((item) => !["publicado"].includes(item.status)).length;

  return (
    <div className="brand-home">
      <section className="brand-home__intro">
        <div>
          <p className="label-caps">{t("brand.home.eyebrow")}</p>
          <h2>{t("brand.home.title")}</h2>
          <p>{t("brand.home.body")}</p>
        </div>
        <div className="brand-home__actions">
          <Link className="btn btn--primary" to={`/m/${brand.slug}/planner`}>{t("brand.action.viewPlanner")}</Link>
          <Link className="btn btn--ghost" to={`/m/${brand.slug}/medios`}>{t("brand.action.addMedia")}</Link>
        </div>
      </section>

      <Section
        className="brand-home__block"
        eyebrow={t("brand.home.identityEyebrow")}
        title={t("brand.home.identity")}
        description={t("brand.home.identity.hint")}
      >
        <div className="brand-home__section-link">
          <Link to={`/m/${brand.slug}/manual`}>{t("brand.home.viewIdentity")}</Link>
        </div>
        <div className="brand-home__identity-body">
          <div className="brand-home__logos" aria-label={t("brand.home.logosLabel")}>
            {logos.length ? logos.slice(0, 4).map((logo) => {
              const src = logo.asset_id ? urls[logo.asset_id] : data?.logoUrls?.[logo.storage_path];
              return <div className="brand-home__logo" key={logo.id} title={logo.variant}>
                {src ? <img src={src} alt={logo.variant} loading="lazy" /> : <span>{brand.name}</span>}
                <small>{logo.variant}</small>
              </div>;
            }) : <Link className="brand-home__logo-empty" to={`/m/${brand.slug}/manual`}>{t(isPending ? "state.loading" : "brand.home.noLogo")}</Link>}
          </div>
          <div className="brand-home__palette" aria-label={t("brand.home.colorsLabel")}>
            {colors.slice(0, 6).map((color) => <div className="brand-home__swatch" key={color.id} title={`${color.name} · ${color.hex}`}>
              <i style={{ background: color.hex }} />
              <span>{color.name}</span>
            </div>)}
            {!colors.length && <Link to={`/m/${brand.slug}/manual`}>{t("brand.home.noColors")}</Link>}
          </div>
        </div>
      </Section>

      <Section
        className="brand-home__block"
        eyebrow={t("brand.home.libraryEyebrow", { count: assets.length })}
        title={t("brand.home.library")}
        description={t("brand.home.library.hint")}
      >
        <div className="brand-home__section-link">
          <Link to={`/m/${brand.slug}/medios`}>{t("brand.home.viewLibrary")}</Link>
        </div>
        {gallery.length ? <div className="brand-home__gallery">
          {gallery.map((asset) => <Link to={`/m/${brand.slug}/medios`} className="brand-home__asset" key={asset.id} title={asset.name}>
            {urls[asset.id] ? <img src={urls[asset.id]} alt={asset.name} loading="lazy" /> : <span aria-hidden="true">{asset.mime_type.startsWith("video/") ? "▶" : "▧"}</span>}
            <small>{asset.name}</small>
          </Link>)}
          <Link className="brand-home__asset-add" to={`/m/${brand.slug}/medios`}>＋<span>{t("brand.home.addVisual")}</span></Link>
        </div> : <Link className="brand-home__empty-link" to={`/m/${brand.slug}/medios`}>{t("brand.home.noAssets")}</Link>}
      </Section>

      <Section
        className="brand-home__block"
        eyebrow={t("brand.home.reuseEyebrow")}
        title={t("brand.home.reuse")}
        description={t("brand.home.reuse.hint")}
      >
        <div className="brand-home__section-link">
          <Link to={`/m/${brand.slug}/bancos`}>{t("brand.home.viewContent")}</Link>
        </div>
        <div className="brand-home__reuse-grid">
          <article>
            <h3>{t("brand.home.captions", { count: captions.length })}</h3>
            {captions.slice(0, 2).map((caption) => <p className="brand-home__caption" key={caption.id}><strong>{caption.title}</strong><span>{caption.body}</span></p>)}
            {!captions.length && <p className="brand-home__muted">{t("brand.home.noCaptions")}</p>}
          </article>
          <article>
            <h3>{t("brand.home.hashtags", { count: hashtags.length })}</h3>
            {hashtags.slice(0, 2).map((set) => <div className="brand-home__tag-set" key={set.id}><strong>{set.name}</strong><p>{set.tags.slice(0, 8).join(" ")}</p></div>)}
            {!hashtags.length && <p className="brand-home__muted">{t("brand.home.noHashtags")}</p>}
          </article>
          <article>
            <h3>{t("brand.home.ctas", { count: ctas.length })}</h3>
            {ctas.slice(0, 2).map((cta) => <p className="brand-home__cta" key={cta.id}>{cta.text}</p>)}
            {!ctas.length && <p className="brand-home__muted">{t("brand.home.noCtas")}</p>}
          </article>
        </div>
      </Section>

      <Section
        className="brand-home__block"
        eyebrow={t("brand.home.nextUp")}
        title={nextItem?.title ?? t("brand.home.noNext")}
        description={t("brand.home.next.hint")}
      >
        <div className="brand-home__next">
          <div><p>{nextItem ? publicationDate(nextItem.scheduled_at) : t("brand.home.nextHint")}</p></div>
          <div className="brand-home__progress"><strong>{isPending ? "—" : activeItems}</strong><span>{t("brand.home.activePieces")}</span><Link className="btn btn--ghost" to={`/m/${brand.slug}/planner`}>{t("brand.nav.planner")}</Link></div>
        </div>
      </Section>
    </div>
  );
}
