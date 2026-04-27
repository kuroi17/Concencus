import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AtSign, Bookmark, GraduationCap, Hash, UserRound, Users } from "lucide-react";
import toast from "react-hot-toast";
import Header from "../common/Header";
import { supabase } from "../lib/supabaseClient";
import EditProfileModal from "../components/ProfileComponents/EditProfileModal";
import { uploadPublicImage } from "../lib/storage";
import MainLayout from "../components/layouts/MainLayout";
import { useCurrentUserProfile } from "../hooks/useCurrentUserProfile";

function buildFallbackProfile(user) {
  return {
    full_name:
      user?.user_metadata?.full_name || user?.email || "Authenticated User",
    sr_code: user?.user_metadata?.sr_code || "No SR Code",
    campus_role: user?.user_metadata?.campus_role || "student",
    block: user?.user_metadata?.block || "Unassigned",
    email: user?.email || "No email",
  };
}

function ProfilePage() {
  const navigate = useNavigate();
  const { user, profile: contextProfile, refreshProfile, updateProfile } = useCurrentUserProfile();
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [savedPosts, setSavedPosts] = useState([]);
  const [savedLoading, setSavedLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      setIsLoading(true);

      try {
        const authUser = user;
        if (!authUser?.id) {
          throw new Error("Unable to load current user profile.");
        }

        const { data: userProfile, error: profileError } = await supabase
          .from("user_profiles")
          .select("id, full_name, sr_code, campus_role, block, avatar_url, cover_url")
          .eq("id", authUser.id)
          .maybeSingle();

        if (!isMounted) return;

        if (profileError || !userProfile) {
          setProfile(buildFallbackProfile(authUser));
        } else {
          setProfile({
            ...userProfile,
            email: authUser.email || "No email",
          });
        }

        const [followersResult, followingResult] = await Promise.all([
          supabase
            .from("user_follows")
            .select("follower_id", { count: "exact", head: true })
            .eq("following_id", authUser.id),
          supabase
            .from("user_follows")
            .select("following_id", { count: "exact", head: true })
            .eq("follower_id", authUser.id),
        ]);

        if (!isMounted) return;

        setFollowersCount(
          followersResult.error ? 0 : followersResult.count || 0,
        );
        setFollowingCount(
          followingResult.error ? 0 : followingResult.count || 0,
        );
      } catch {
        if (isMounted) {
          setProfile({
            full_name: "Authenticated User",
            sr_code: "No SR Code",
            campus_role: "student",
            block: "Unassigned",
            email: "No email",
          });
          setFollowersCount(0);
          setFollowingCount(0);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  // Keep local profile in sync with UserContext (avatar + sr/block updates propagate)
  useEffect(() => {
    if (!contextProfile) return;
    setProfile((prev) => ({ ...(prev || {}), ...(contextProfile || {}) }));
  }, [contextProfile]);

  // ── Fetch saved posts ───────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    const loadSavedPosts = async () => {
      setSavedLoading(true);
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) {
        if (isMounted) setSavedLoading(false);
        return;
      }

      const { data: saves } = await supabase
        .from("saved_posts")
        .select("post_id, created_at")
        .eq("user_id", authData.user.id)
        .order("created_at", { ascending: false });

      if (!saves || saves.length === 0) {
        if (isMounted) {
          setSavedPosts([]);
          setSavedLoading(false);
        }
        return;
      }

      const postIds = saves.map((s) => s.post_id);
      const { data: posts } = await supabase
        .from("forum_posts_view")
        .select("id, title, tag, score, comment_count, created_at")
        .in("id", postIds);

      if (isMounted) {
        // Preserve saved order
        const postMap = new Map((posts || []).map((p) => [p.id, p]));
        setSavedPosts(postIds.map((id) => postMap.get(id)).filter(Boolean));
        setSavedLoading(false);
      }
    };

    loadSavedPosts();
    return () => { isMounted = false; };
  }, []);

  const handleUnsave = async (postId) => {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return;
    await supabase
      .from("saved_posts")
      .delete()
      .eq("user_id", authData.user.id)
      .eq("post_id", postId);
    setSavedPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const initials = useMemo(() => {
    const source = profile?.full_name || "U";

    return source
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }, [profile?.full_name]);

  return (
    <MainLayout title="My Profile">
      <div className="mx-auto flex w-full max-w-[1040px] flex-col gap-6 py-6">
        <main className="soft-enter space-y-6 pt-2" role="main">
          {/* ── Profile Hero Section ────────────────────────────────────────── */}
          <section className="relative overflow-hidden rounded-[24px] border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 shadow-[0_20px_50px_rgba(15,23,42,0.06)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
            {/* Banner */}
            <div className="relative h-48 w-full overflow-hidden sm:h-64 bg-slate-200 dark:bg-slate-800">
              <img
                src={profile?.cover_url || "/assets/images/campus_banner.png"}
                alt="Profile Banner"
                className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
            </div>

            <div className="relative px-6 pb-8">
              {/* Overlapping Avatar */}
              <div className="relative -mt-16 mb-4 flex items-end justify-between sm:-mt-20">
                <div className="group relative h-32 w-32 shrink-0 overflow-hidden rounded-full border-[6px] border-white dark:border-slate-900 bg-white dark:bg-slate-900 shadow-xl sm:h-40 sm:w-40">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Profile avatar"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[#800000] text-3xl font-bold text-white">
                      {initials || "U"}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/5" />
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditOpen(true)}
                  className="mb-2 inline-flex items-center justify-center rounded-xl bg-slate-900 dark:bg-slate-100 px-5 py-2.5 text-sm font-semibold text-white dark:text-slate-900 shadow-lg shadow-slate-900/20 dark:shadow-black/20 transition-all hover:-translate-y-0.5 hover:bg-slate-800 dark:hover:bg-white active:translate-y-0"
                >
                  Edit Profile
                </button>
              </div>

              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="min-w-0">
                  <h2 className="m-0 text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                    {isLoading ? "Loading profile…" : profile?.full_name}
                  </h2>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-lg bg-red-50 dark:bg-red-900/20 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-[#800000] dark:text-red-400 ring-1 ring-inset ring-red-100 dark:ring-red-900/30">
                      {isLoading ? "…" : profile?.campus_role || "student"}
                    </span>
                    <span className="text-sm text-slate-400">·</span>
                    <p className="m-0 text-sm font-medium text-slate-500 dark:text-slate-400">
                      BatStateU Governance Platform
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* ── Left Column: Identity Info ────────────────────────────────── */}
            <section className="lg:col-span-1 space-y-4">
              <div className="rounded-[24px] border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 p-6 shadow-sm">
                <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">Governance Identity</h3>
                <div className="space-y-4">
                  <article className="group relative overflow-hidden rounded-2xl bg-slate-50/50 dark:bg-slate-800/50 p-4 transition-all hover:bg-slate-50 dark:hover:bg-slate-800">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">SR Code</p>
                    <p className="mt-1 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                      <Hash size={16} className="text-slate-400 dark:text-slate-500" />
                      {isLoading ? "..." : profile?.sr_code || "No SR Code"}
                    </p>
                  </article>

                  <article className="group relative overflow-hidden rounded-2xl bg-slate-50/50 dark:bg-slate-800/50 p-4 transition-all hover:bg-slate-50 dark:hover:bg-slate-800">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Block / Section</p>
                    <p className="mt-1 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                      <GraduationCap size={16} className="text-slate-400 dark:text-slate-500" />
                      {isLoading ? "..." : profile?.block || "Unassigned"}
                    </p>
                  </article>

                  <article className="group relative overflow-hidden rounded-2xl bg-slate-50/50 dark:bg-slate-800/50 p-4 transition-all hover:bg-slate-50 dark:hover:bg-slate-800">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Official Email</p>
                    <p className="mt-1 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white break-all">
                      <AtSign size={16} className="text-slate-400 dark:text-slate-500" />
                      {isLoading ? "..." : profile?.email || "No email"}
                    </p>
                  </article>
                </div>
              </div>
            </section>

            {/* ── Right Column: Saved Content ────────────────────────────────── */}
            <section className="lg:col-span-2">
              <div className="overflow-hidden rounded-[24px] border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-500">
                      <Bookmark size={20} fill="currentColor" className="opacity-80" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Bookmarked Discussions</h3>
                  </div>
                  <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    {savedPosts.length} Items
                  </span>
                </div>

                <div className="p-6">
                  {savedLoading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 dark:border-slate-800 border-t-[#800000]" />
                      <p className="mt-4 text-sm font-medium text-slate-400 dark:text-slate-500">Syncing bookmarks...</p>
                    </div>
                  ) : savedPosts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="mb-4 rounded-full bg-slate-50 dark:bg-slate-800 p-4">
                        <Bookmark size={32} className="text-slate-200 dark:text-slate-700" />
                      </div>
                      <p className="max-w-[240px] text-sm font-medium text-slate-400 dark:text-slate-500">
                        No saved posts yet. Bookmark discussions from the forum to find them here.
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {savedPosts.map((post) => (
                        <div
                          key={post.id}
                          onClick={() => navigate(`/hub?post=${post.id}`)}
                          className="group flex cursor-pointer items-center gap-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 transition-all hover:border-red-100 dark:hover:border-red-900/40 hover:bg-red-50/30 dark:hover:bg-red-900/10 hover:shadow-md hover:shadow-red-900/5"
                        >
                          <div className="min-w-0 flex-1">
                            <h4 className="m-0 text-[15px] font-bold text-slate-900 dark:text-white group-hover:text-[#800000] dark:group-hover:text-red-400 transition-colors line-clamp-1">
                              {post.title}
                            </h4>
                            <div className="mt-2 flex items-center gap-3">
                              <span className="inline-flex rounded-md bg-white dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700">
                                {post.tag || "General"}
                              </span>
                              <div className="flex items-center gap-3 text-[11px] font-medium text-slate-400 dark:text-slate-500">
                                <span className="flex items-center gap-1">
                                  {parseInt(post.score, 10) || 0} votes
                                </span>
                                <span>•</span>
                                <span>{parseInt(post.comment_count, 10) || 0} comments</span>
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnsave(post.id);
                            }}
                            className="shrink-0 flex h-10 w-10 items-center justify-center rounded-xl text-slate-300 dark:text-slate-600 transition-all hover:bg-red-100 dark:hover:bg-red-900/40 hover:text-red-600 dark:hover:text-red-400"
                            title="Remove bookmark"
                          >
                            <Bookmark size={18} fill="currentColor" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>

      <EditProfileModal
        isOpen={isEditOpen}
        initialProfile={profile}
        onClose={() => setIsEditOpen(false)}
        onSave={async ({ sr_code, block, avatarFile, coverFile }) => {
          const { data: authData, error: authError } = await supabase.auth.getUser();
          if (authError || !authData?.user) {
            toast.error("You must be logged in.");
            return false;
          }

          let avatarUrl = profile?.avatar_url || null;
          if (avatarFile) {
            try {
              avatarUrl = await uploadPublicImage({
                bucketName: "user-avatars",
                pathPrefix: `${authData.user.id}`,
                file: avatarFile,
                upsert: true,
              });
            } catch (error) {
              toast.error(error?.message || "Failed to upload avatar.");
              return false;
            }
          }

          let coverUrl = profile?.cover_url || null;
          if (coverFile) {
            try {
              coverUrl = await uploadPublicImage({
                bucketName: "user-avatars",
                pathPrefix: `${authData.user.id}/cover`,
                file: coverFile,
                upsert: true,
              });
            } catch (error) {
              toast.error(error?.message || "Failed to upload cover photo.");
              return false;
            }
          }

          const { data: updated, error } = await supabase
            .from("user_profiles")
            .update({
              sr_code,
              block,
              avatar_url: avatarUrl,
              cover_url: coverUrl,
            })
            .eq("id", authData.user.id)
            .select("id, full_name, sr_code, campus_role, block, avatar_url, cover_url")
            .maybeSingle();

          if (error) {
            toast.error(error.message || "Failed to update profile.");
            return false;
          }

          if (updated) {
            // Update local state with fresh data
            setProfile((prev) => ({
              ...(prev || {}),
              ...updated,
              avatar_url: updated.avatar_url ? `${updated.avatar_url}${updated.avatar_url.includes("?") ? "&" : "?"}t=${Date.now()}` : null,
              email: authData.user.email || prev?.email || "No email",
            }));

            // Update global context so ALL pages update immediately
            updateProfile?.({
              ...updated,
              avatar_url: updated.avatar_url ? `${updated.avatar_url}${updated.avatar_url.includes("?") ? "&" : "?"}t=${Date.now()}` : null,
            });
            refreshProfile?.();
          }

          return true;
        }}
      />
    </MainLayout>
  );
}

export default ProfilePage;
