import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

function buildFallbackProfile(user) {
  return {
    id: user?.id || null,
    full_name:
      user?.user_metadata?.full_name || user?.email || "Authenticated User",
    sr_code: user?.user_metadata?.sr_code || "No SR Code",
    campus_role: user?.user_metadata?.campus_role || "student",
    block: user?.user_metadata?.block || "Unassigned",
    avatar_url: user?.user_metadata?.avatar_url || null,
    email: user?.email || "No email",
  };
}

export function useCurrentUserProfile() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  const loadProfile = useCallback(async () => {
    setIsLoadingProfile(true);

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError || !authData?.user) {
        setUser(null);
        setProfile(null);
        return;
      }

      const currentUser = authData.user;
      setUser(currentUser);

      const { data: userProfile, error: profileError } = await supabase
        .from("user_profiles")
        .select("id, full_name, sr_code, campus_role, block, avatar_url")
        .eq("id", currentUser.id)
        .maybeSingle();

      if (profileError || !userProfile) {
        setProfile(buildFallbackProfile(currentUser));
        return;
      }

      setProfile({
        ...userProfile,
        email: currentUser.email || "No email",
      });
    } finally {
      setIsLoadingProfile(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      loadProfile();
    });
  }, [loadProfile]);

  return {
    user,
    profile,
    isLoadingProfile,
    isAdmin: profile?.campus_role === "admin",
    refreshProfile: loadProfile,
  };
}
