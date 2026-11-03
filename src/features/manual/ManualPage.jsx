import { Link, useOutletContext } from "react-router-dom";
import { useI18n } from "../../i18n/index.jsx";
import { useBrandMediaAssets } from "../../lib/brand-media.js";
import ColorsSection from "./ColorsSection.jsx";
import FontsSection from "./FontsSection.jsx";
import GuidelinesSection from "./GuidelinesSection.jsx";
import LogosSection from "./LogosSection.jsx";
import ManualStatus from "./ManualStatus.jsx";
import { useManual, useSignedFiles } from "./useManual.js";
import "./manual.css";

export default function ManualPage() {
  const { t } = useI18n();
  // The workspace layout already resolved the brand and its permissions.
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

  return (
    <div className="manual">
      <header className="manual__head">
        <div>
          <h2>{t("manual.title")}</h2>
          <p className="manual__lead">{t("manual.lead")}</p>
        </div>

        <Link className="btn btn--ghost" to={`/m/${brand.slug}/manual/ver`}>
          {t("manual.viewDocument")}
        </Link>
      </header>

      <ColorsSection brandId={brand.id} colors={manual.data.colors} />

      <FontsSection brandId={brand.id} fonts={fonts} urls={urls} />

      <LogosSection brandId={brand.id} logos={logos} urls={urls} assets={brandMedia.data?.assets ?? []} assetUrls={brandMedia.data?.urls ?? {}} />

      <GuidelinesSection brandId={brand.id} guidelines={manual.data.guidelines} />
    </div>
  );
}
