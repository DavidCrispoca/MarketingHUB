import { useMatch, useNavigate } from "react-router-dom";
import { useI18n } from "../i18n/index.jsx";
import { useBrands } from "../features/brands/useBrands.js";

// Lives in the top bar, so it reads the slug from the URL instead of params.
// The trailing "*" keeps the current section when switching brand.
export default function BrandSwitcher() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const match = useMatch("/m/:brandSlug/*");
  const { data: brands = [] } = useBrands();

  if (brands.length === 0) return null;

  const section = match?.params["*"] ?? "";

  return (
    <label className="brand-switch">
      <span className="sr-only">{t("brand.switcher.label")}</span>
      <select
        className="brand-switch__select"
        value={match?.params.brandSlug ?? ""}
        onChange={(event) => {
          const slug = event.target.value;
          if (!slug) {
            navigate("/");
            return;
          }
          navigate(`/m/${slug}${section ? `/${section}` : ""}`);
        }}
      >
        <option value="">{t("brands.title")}</option>
        {brands.map((brand) => (
          <option key={brand.id} value={brand.slug}>
            {brand.name}
          </option>
        ))}
      </select>
    </label>
  );
}
