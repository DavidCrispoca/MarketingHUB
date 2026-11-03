import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Providers from "./app/providers.jsx";
import AppShell from "./app/AppShell.jsx";
import Splash from "./components/Splash.jsx";
import { useI18n } from "./i18n/index.jsx";
import { AuthProvider, useAuth } from "./features/auth/AuthProvider.jsx";
import AccessPage from "./features/auth/AccessPage.jsx";
import SetupNotice from "./features/auth/SetupNotice.jsx";
import BrandsPage from "./features/brands/BrandsPage.jsx";
import BrandWorkspace from "./features/brands/BrandWorkspace.jsx";
import BrandHome from "./features/brands/BrandHome.jsx";
import NotFoundPage from "./features/misc/NotFoundPage.jsx";

// The manual is the only place that pulls in the Markdown renderer, so it gets
// its own chunk instead of weighing down the first paint.
const ManualPage = lazy(() => import("./features/manual/ManualPage.jsx"));
const ManualDocument = lazy(() => import("./features/manual/ManualDocument.jsx"));
const MediaPage = lazy(() => import("./features/media/MediaPage.jsx"));
const BanksPage = lazy(() => import("./features/banks/BanksPage.jsx"));
const PlannerPage = lazy(() => import("./features/planner/PlannerPage.jsx"));
const InsightsPage = lazy(() => import("./features/social/InsightsPage.jsx"));
const ImageEditorPage = lazy(() => import("./features/editor/ImageEditorPage.jsx"));

function PageLoading() {
  const { t } = useI18n();

  return (
    <p className="state" role="status">
      {t("state.loading")}
    </p>
  );
}

function suspending(node) {
  return <Suspense fallback={<PageLoading />}>{node}</Suspense>;
}

// Nothing to route until a session exists and its access code is redeemed.
function Gate() {
  const { status } = useAuth();

  if (status === "loading") return <Splash />;
  if (status === "unconfigured") return <SetupNotice reason="unconfigured" />;
  if (status === "auth-disabled") return <SetupNotice reason="auth-disabled" />;
  if (status === "error") return <SetupNotice reason="error" />;
  if (status === "needs-code") return <AccessPage />;

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<BrandsPage />} />
        <Route path="m/:brandSlug" element={<BrandWorkspace />}>
          <Route index element={<BrandHome />} />
          <Route path="manual" element={suspending(<ManualPage />)} />
          <Route path="manual/ver" element={suspending(<ManualDocument />)} />
          <Route path="medios" element={suspending(<MediaPage />)} />
          <Route path="bancos" element={suspending(<BanksPage />)} />
          <Route path="planner" element={suspending(<PlannerPage />)} />
          <Route path="dashboard" element={suspending(<InsightsPage />)} />
          <Route path="editor/:assetId" element={suspending(<ImageEditorPage />)} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <Providers>
      <BrowserRouter>
        <AuthProvider>
          <Gate />
        </AuthProvider>
      </BrowserRouter>
    </Providers>
  );
}
