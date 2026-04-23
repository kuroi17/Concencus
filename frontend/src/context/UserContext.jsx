import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  const bustAvatarCache = useCallback((nextProfile) => {
    if (!nextProfile?.avatar_url) return nextProfile;
    const url = String(nextProfile.avatar_url);
    const nextUrl = `${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}`;
    return { ...nextProfile, avatar_url: nextUrl };
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        setUser(null);
        setProfile(null);
        setIsLoadingProfile(false);
        return;
      }

      setUser(authUser);

      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", authUser.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
      }
      
      const fallback = {
        id: authUser.id,
        full_name: authUser.user_metadata?.full_name || "User",
        campus_role: "student",
        has_completed_onboarding: false,
      };

      setProfile(bustAvatarCache(data || fallback));
    } catch (err) {
      console.error("Fatal error in loadProfile:", err);
    } finally {
      setIsLoadingProfile(false);
    }
  }, [bustAvatarCache]);

  useEffect(() => {
    // Initial load
    loadProfile();

    // Auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setIsLoadingProfile(false);
      } else if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          setUser(session.user);
          loadProfile();
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  // Realtime: keep the current user's profile fresh (PF picture updates instantly across pages)
  useEffect(() => {
    if (!user?.id) return undefined;

    const channel = supabase
      .channel(`user-profile-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_profiles",
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          const next = payload?.new || null;
          if (next) {
            setProfile(bustAvatarCache(next));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bustAvatarCache, user?.id]);

  const updateProfile = useCallback((partial) => {
    setProfile((prev) => {
      const merged = { ...(prev || {}), ...(partial || {}) };
      return bustAvatarCache(merged);
    });
  }, [bustAvatarCache]);

  const isAdmin = useMemo(() => profile?.campus_role === "admin", [profile?.campus_role]);

  const value = {
    user,
    profile,
    isLoadingProfile,
    isAdmin,
    refreshProfile: loadProfile,
    updateProfile,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
