import { Link, useOutletContext } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useI18n } from "../../i18n/index.jsx";
import { useBrandMediaAssets } from "../../lib/brand-media.js";
import { BrandFontStyles, fontFamilyAlias, fontWeights } from "./brandFonts.jsx";
import Markdown from "./Markdown.jsx";
import ManualStatus from "./ManualStatus.jsx";
import { useManual, useSignedFiles } from "./useManual.js";
import "./manual.css";

// Read-only version of the manual, meant to be shared or printed as a PDF.
export default function ManualDocument() {
  const { t } = useI18n();
  const brand = useOutletContext();

  const manual = useManual(brand.id);
  const fonts = manual.data?.fonts ?? [];
  const logos = manual.data?.logos ?? [];
  const brandMedia = useBrandMediaAssets(brand.id);

  const urls = useSignedFiles([
    ...fonts.map((font) => font.storage_path),
    ...logos.map((logo) => logo.storage_path),
  ]);

  if (manual.isPending || manual.isError) {
    return (
      <ManualStatus
        isPending={manual.isPending}
        isError={manual.isError}
        refetch={manual.refetch}
      />
    );
  }

  const { colors, guidelines } = manual.data;

  return (
    <article className="doc">
      <div className="doc__actions">
        <button className="btn btn--ghost" type="button" onClick={() => window.print()}>
          {t("manual.document.print")}
        </button>
        <Link className="btn btn--quiet" to={`/m/${brand.slug}/manual`}>
          {t("manual.document.edit")}
        </Link>
      </div>

      <header className="doc__head">
        <p className="label-caps">{t("manual.document.tag")}</p>
        <h1>{brand.name}</h1>
        {brand.description ? <p className="doc__lead">{brand.description}</p> : null}
        <p className="doc__meta">
          {t("manual.document.generated", {
            date: format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: es }),
          })}
        </p>
      </header>

      <BrandFontStyles fonts={fonts} urls={urls} />

      <section className="doc__section">
        <h2>{t("manual.colors.title")}</h2>

        {colors.length === 0 ? (
          <p className="doc__empty">{t("manual.document.empty")}</p>
        ) : (
          <ul className="doc__colors">
            {colors.map((color) => (
              <li key={color.id} className="doc-swatch">
                <span
                  className="doc-swatch__chip"
                  style={{ background: color.hex }}
                  aria-hidden="true"
                />
                <div className="doc-swatch__body">
                  <p className="doc-swatch__name">
                    {color.name} <span className="doc-swatch__hex">{color.hex}</span>
                  </p>
                  <p className="doc-swatch__meta">
                    {t(`manual.colors.role.${color.role}`)} · rgb({color.r}, {color.g}, {color.b})
                    {color.cmyk ? ` · CMYK ${color.cmyk}` : ""}
                    {color.pantone ? ` · Pantone ${color.pantone}` : ""}
                  </p>
                  {color.usage_notes ? (
                    <p className="doc-swatch__notes">{color.usage_notes}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="doc__section">
        <h2>{t("manual.fonts.title")}</h2>

        {fonts.length === 0 ? (
          <p className="doc__empty">{t("manual.document.empty")}</p>
        ) : (
          fonts.map((font) => {
            const weights = fontWeights(font);
            const family = fontFamilyAlias(font);

            return (
              <div key={font.id} className="doc-font">
                <p className="doc-font__name">
                  {font.family}{" "}
                  <span className="label-caps">{t(`manual.fonts.role.${font.role}`)}</span>
                </p>
                <p className="doc-font__meta">
                  {t("manual.fonts.weights")}: {weights.join(" · ")}
                </p>

                {weights.map((weight) => (
                  <p
                    key={weight}
                    className="doc-font__sample"
                    style={{ fontFamily: `"${family}"`, fontWeight: weight }}
                  >
                    {t("manual.fonts.sample")}
                  </p>
                ))}

                {font.license_notes ? (
                  <p className="doc-font__meta">{font.license_notes}</p>
                ) : null}
              </div>
            );
          })
        )}
      </section>

      <section className="doc__section">
        <h2>{t("manual.logos.title")}</h2>

        {logos.length === 0 ? (
          <p className="doc__empty">{t("manual.document.empty")}</p>
        ) : (
          <ul className="doc__logos">
            {logos.map((logo) => {
                const url = logo.asset_id ? brandMedia.data?.urls?.[logo.asset_id] : logo.storage_path ? urls[logo.storage_path] : null;

              return (
                <li key={logo.id} className="doc-logo">
                  <div className="doc-logo__frame">
                    {url ? (
                      <img className="doc-logo__image" src={url} alt={logo.variant} />
                    ) : (
                      <p className="doc__empty">{t("manual.logos.noFile")}</p>
                    )}
                  </div>
                  <p className="doc-logo__name">{logo.variant}</p>
                  {logo.min_size_px ? (
                    <p className="doc-logo__meta">
                      {t("manual.logos.minSizeValue", { px: logo.min_size_px })}
                    </p>
                  ) : null}
                  {logo.clear_space_notes ? (
                    <p className="doc-logo__meta">{logo.clear_space_notes}</p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="doc__section">
        <h2>{t("manual.guidelines.title")}</h2>

        {guidelines.length === 0 ? (
          <p className="doc__empty">{t("manual.document.empty")}</p>
        ) : (
          guidelines.map((guideline) => (
            <div key={guideline.id} className="doc-guideline">
              <p className="doc-guideline__title">
                {guideline.title}{" "}
                <span className="label-caps">
                  {t(`manual.guidelines.section.${guideline.section}`)}
                </span>
              </p>
              <Markdown>{guideline.body_md}</Markdown>
            </div>
          ))
        )}
      </section>
    </article>
  );
}
