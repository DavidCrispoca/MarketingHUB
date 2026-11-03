import { Link, NavLink, Outlet, useLocation, useParams } from "react-router-dom";
import { useI18n } from "../../i18n/index.jsx";
import { useBrand } from "./useBrands.js";
import "./brands.css";

const navClass = ({ isActive }) => `brand__nav-link${isActive ? " is-active" : ""}`;

// Layout for a brand: the header and the section navigation stay put while the
// section itself is rendered by the child route.
export default function BrandWorkspace() {
  const { t } = useI18n();
  const { brandSlug } = useParams();
  const location = useLocation();
  const { data: brand, isPending, isError, refetch } = useBrand(brandSlug);

  if (isPending) {
    return (
      <p className="state" role="status">
        {t("state.loading")}
      </p>
    );
  }

  if (isError) {
    return (
      <div className="state" role="alert">
        <p>{t("state.error")}</p>
        <button className="btn btn--ghost" type="button" onClick={() => refetch()}>
          {t("state.retry")}
        </button>
      </div>
    );
  }

  // A brand from another access code is simply not visible: RLS returns nothing.
  if (!brand) {
    return (
      <div className="state">
        <h1>{t("brand.notFound.title")}</h1>
        <p>{t("brand.notFound.body")}</p>
        <Link className="btn btn--ghost" to="/">
          {t("notfound.back")}
        </Link>
      </div>
    );
  }

  return (
    <section className="brand">
      <header className="brand__head">
        <div className="brand__head-copy">
          <p className="label-caps">{t("brand.workspace.label")}</p>
          <h1>{brand.name}</h1>
          {brand.description ? <p className="brand__lead">{brand.description}</p> : null}
        </div>
        <Link className="btn btn--primary brand__create" to={`/m/${brand.slug}/planner?crear=1`}>
          {t("brand.action.new")}
        </Link>
      </header>

      <div className="brand__layout">
        <nav className="brand__nav" aria-label={t("brand.nav.label")}>
          <div className="brand__nav-group">
            <span>{t("brand.nav.group.brand")}</span>
            <NavLink className={navClass} to={`/m/${brand.slug}`} end>{t("brand.nav.home")}</NavLink>
            <NavLink className={navClass} to={`/m/${brand.slug}/manual`}>{t("brand.nav.manual")}</NavLink>
            <NavLink className={navClass} to={`/m/${brand.slug}/medios`}>{t("brand.nav.media")}</NavLink>
            <NavLink className={navClass} to={`/m/${brand.slug}/bancos`}>{t("brand.nav.banks")}</NavLink>
          </div>
          <div className="brand__nav-group">
            <span>{t("brand.nav.group.workflow")}</span>
            <NavLink className={navClass} to={`/m/${brand.slug}/planner`}>{t("brand.nav.planner")}</NavLink>
          </div>
          <div className="brand__nav-group">
            <span>{t("brand.nav.group.insights")}</span>
            <NavLink className={navClass} to={`/m/${brand.slug}/dashboard`}>{t("brand.nav.dashboard")}</NavLink>
          </div>
        </nav>

        <div className="brand__content" key={location.pathname}>
          <Outlet context={brand} />
        </div>
      </div>
    </section>
  );
}
