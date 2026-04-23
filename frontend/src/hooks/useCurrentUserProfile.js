import { useUser } from "../context/UserContext";

/**
 * useCurrentUserProfile — Hook to consume the global UserContext.
 * Migrated from local state to global context to prevent flickering on route changes.
 */
export function useCurrentUserProfile() {
  const { user, profile, isLoadingProfile, isAdmin, refreshProfile, updateProfile } = useUser();

  return {
    user,
    currentUser: user, // Alias for backward compatibility if needed
    profile,
    isLoadingProfile,
    isAdmin,
    refreshProfile,
    updateProfile,
  };
}
