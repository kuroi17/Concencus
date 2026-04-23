import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

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
      
      setProfile(data || {
        id: authUser.id,
        full_name: authUser.user_metadata?.full_name || "User",
        campus_role: "student",
        has_completed_onboarding: false,
      });
    } catch (err) {
      console.error("Fatal error in loadProfile:", err);
    } finally {
      setIsLoadingProfile(false);
    }
  }, []);

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

  const value = {
    user,
    profile,
    isLoadingProfile,
    isAdmin: profile?.campus_role === "admin",
    refreshProfile: loadProfile,
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
