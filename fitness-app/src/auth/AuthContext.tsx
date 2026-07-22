import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { isDemoMode, isSupabaseConfigured, supabase } from "../lib/supabase";

export interface AuthUser {
  id: string;
  email: string;
}
interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  demoMode: boolean;
  configured: boolean;
  signIn: (email: string, password: string) => Promise<string | undefined>;
  signUp: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<string | undefined>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<string | undefined>;
}
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(
    isDemoMode ? { id: "demo-user", email: "demo@wld.local" } : null,
  );
  const [loading, setLoading] = useState(!isDemoMode && isSupabaseConfigured);
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user;
      setUser(u ? { id: u.id, email: u.email ?? "" } : null);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user;
      setUser(u ? { id: u.id, email: u.email ?? "" } : null);
      setLoading(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      demoMode: isDemoMode,
      configured: isSupabaseConfigured,
      signIn: async (email, password) => {
        if (isDemoMode) {
          setUser({ id: "demo-user", email });
          return;
        }
        if (!supabase) return "Supabase ist noch nicht konfiguriert.";
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        return error?.message;
      },
      signUp: async (email, password, displayName) => {
        if (isDemoMode) {
          setUser({ id: "demo-user", email });
          return;
        }
        if (!supabase) return "Supabase ist noch nicht konfiguriert.";
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: displayName } },
        });
        return error?.message;
      },
      signOut: async () => {
        if (supabase) await supabase.auth.signOut();
        setUser(null);
      },
      resetPassword: async (email) => {
        if (isDemoMode) return;
        if (!supabase) return "Supabase ist noch nicht konfiguriert.";
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${location.origin}/fitness/login`,
        });
        return error?.message;
      },
    }),
    [user, loading],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
