import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { initializeLocalData } from "../../lib/local-backend.js";
import { isLocalMode, isSupabaseConfigured, supabase } from "../../lib/supabase.js";

const AuthContext = createContext(null);

// "loading"      → checking the stored session
// "unconfigured" → .env.local is missing
// "auth-disabled"→ anonymous sign-ins are off in the Supabase project
// "error"        → something else went wrong while opening the session
// "needs-code"   → session open, but no access code redeemed yet
// "ready"        → access code redeemed
export function AuthProvider({ children }) {
  const [status, setStatus] = useState("loading");
  const [session, setSession] = useState(null);
  const [grant, setGrant] = useState(null);
  const startedRef = useRef(false);

  // The grant is the only readable row tied to this session (RLS: own row only).
  const readGrant = useCallback(async () => {
    const { data, error } = await supabase
      .from("access_grants")
      .select("access_code_id, holder_name, created_at")
      .maybeSingle();
    if (error) throw error;
    return data ?? null;
  }, []);

  const bootstrap = useCallback(async () => {
    if (isLocalMode) {
      try {
        await initializeLocalData();
        const holderName = localStorage.getItem("marketinghub.local.name") || "Equipo local";
        const localGrant = { access_code_id: "local-marketinghub-workspace", holder_name: holderName, created_at: new Date().toISOString() };
        setSession({ user: { id: "local-user" }, access_token: "local-session" });
        setGrant(localGrant);
        setStatus("ready");
      } catch {
        setStatus("error");
      }
      return;
    }
    if (!isSupabaseConfigured) {
      setStatus("unconfigured");
      return;
    }

    setStatus("loading");
    try {
      const {
        data: { session: stored },
      } = await supabase.auth.getSession();

      let active = stored;
      if (!active) {
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) {
          setStatus(/anonymous/i.test(error.message ?? "") ? "auth-disabled" : "error");
          return;
        }
        active = data.session;
      }

      setSession(active);
      const currentGrant = await readGrant();
      setGrant(currentGrant);
      setStatus(currentGrant ? "ready" : "needs-code");
    } catch {
      setStatus("error");
    }
  }, [readGrant]);

  // StrictMode mounts effects twice; the guard keeps a single anonymous session.
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    bootstrap();
  }, [bootstrap]);

  // The code is validated server-side; the browser only learns the outcome.
  const redeem = useCallback(
    async (name, _code) => {
      if (isLocalMode) {
        const holderName = name.trim() || "Equipo local";
        localStorage.setItem("marketinghub.local.name", holderName);
        setGrant({ access_code_id: "local-marketinghub-workspace", holder_name: holderName, created_at: new Date().toISOString() });
        setStatus("ready");
        return { ok: true };
      }
      const { data, error } = await supabase.functions.invoke("redeem-code", {
        body: { name, code: _code },
      });

      if (error) {
        let reason = "network";
        try {
          const body = await error.context.json();
          if (body?.error) reason = body.error;
        } catch {
          reason = "server_error";
        }
        return { ok: false, reason };
      }

      if (!data?.ok) return { ok: false, reason: data?.error ?? "server_error" };

      const currentGrant = await readGrant();
      setGrant(currentGrant);
      setStatus("ready");
      return { ok: true };
    },
    [readGrant],
  );

  const signOut = useCallback(async () => {
    if (isLocalMode) return;
    await supabase.auth.signOut();
    setSession(null);
    setGrant(null);
    await bootstrap();
  }, [bootstrap]);

  const value = useMemo(
    () => ({ status, session, grant, redeem, signOut, reload: bootstrap }),
    [status, session, grant, redeem, signOut, bootstrap],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside an AuthProvider");
  return context;
}
