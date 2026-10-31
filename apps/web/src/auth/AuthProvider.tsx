import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

export type AppRole = "admin" | "partner";

export interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  role: AppRole;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  configured: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  // eslint-disable-next-line no-unused-vars
  setDevPreviewRole?: (role: AppRole | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readableError(message: string) {
  if (/not allowlisted/i.test(message)) {
    return "บัญชี Google นี้ยังไม่ได้รับอนุญาตให้เข้าใช้งาน กรุณาติดต่อผู้ดูแลระบบ";
  }
  return message;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dev preview support for local UI testing
  const [devRole, setDevRole] = useState<AppRole | null>(() => {
    if (!import.meta.env.DEV) return null;
    const urlRole = typeof window !== "undefined" ? (new URLSearchParams(window.location.search).get("role") as AppRole | null) : null;
    if (urlRole) {
      sessionStorage.setItem("money_dev_role", urlRole);
      return urlRole;
    }
    return (sessionStorage.getItem("money_dev_role") as AppRole) || null;
  });

  const setDevPreviewRole = useCallback((role: AppRole | null) => {
    if (!import.meta.env.DEV) return;
    setDevRole(role);
    if (role) {
      sessionStorage.setItem("money_dev_role", role);
      setProfile({
        id: "dev-preview-user",
        email: "kajonsak.dev@gmail.com",
        display_name: "kajonsak",
        role,
      });
    } else {
      sessionStorage.removeItem("money_dev_role");
      setProfile(null);
    }
  }, []);

  const loadProfile = useCallback(async (user: User | null) => {
    if (!user || !supabase) {
      if (import.meta.env.DEV && devRole) {
        setProfile({
          id: "dev-preview-user",
          email: "kajonsak.dev@gmail.com",
          display_name: "kajonsak",
          role: devRole,
        });
      } else {
        setProfile(null);
      }
      return;
    }

    const { data, error: profileError } = await supabase
      .from("profiles")
      .select("id,email,display_name,role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      setError(readableError(profileError.message));
      setProfile(null);
      return;
    }
    setProfile(data as UserProfile | null);
  }, [devRole]);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let active = true;
    void supabase.auth.getSession().then(async ({ data, error: sessionError }) => {
      if (!active) return;
      if (sessionError) setError(sessionError.message);
      setSession(data.session);
      await loadProfile(data.session?.user ?? null);
      if (active) setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) {
        if (!devRole) setProfile(null);
        setLoading(false);
        return;
      }
      window.setTimeout(() => {
        if (active) {
          void loadProfile(nextSession.user).finally(() => setLoading(false));
        }
      }, 0);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [loadProfile, devRole]);

  const signInWithGoogle = useCallback(async () => {
    if (!supabase) {
      setError("ยังไม่ได้ตั้งค่า Supabase URL และ Publishable Key");
      return;
    }
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (signInError) setError(readableError(signInError.message));
  }, []);

  const signOut = useCallback(async () => {
    if (import.meta.env.DEV) {
      setDevPreviewRole(null);
    }
    if (!supabase) return;
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) setError(signOutError.message);
  }, [setDevPreviewRole]);

  const activeUser = useMemo(() => {
    if (session?.user) return session.user;
    if (import.meta.env.DEV && devRole) {
      return {
        id: "dev-preview-user",
        email: "kajonsak.dev@gmail.com",
        user_metadata: { name: "kajonsak" },
        app_metadata: {},
        aud: "authenticated",
        created_at: new Date().toISOString(),
      } as unknown as User;
    }
    return null;
  }, [session?.user, devRole]);

  const activeProfile = useMemo(() => {
    if (profile) return profile;
    if (import.meta.env.DEV && devRole) {
      return {
        id: "dev-preview-user",
        email: "kajonsak.dev@gmail.com",
        display_name: "kajonsak",
        role: devRole,
      };
    }
    return null;
  }, [profile, devRole]);

  const value = useMemo<AuthContextValue>(() => ({
    user: activeUser,
    session,
    profile: activeProfile,
    loading,
    configured: isSupabaseConfigured,
    error,
    signInWithGoogle,
    signOut,
    setDevPreviewRole,
  }), [activeUser, session, activeProfile, loading, error, signInWithGoogle, signOut, setDevPreviewRole]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
