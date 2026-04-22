import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AtSign, Bookmark, GraduationCap, Hash, UserRound, Users } from "lucide-react";
import Header from "../common/Header";
import { supabase } from "../lib/supabaseClient";
import EditProfileModal from "../components/ProfileComponents/EditProfileModal";
import { uploadPublicImage } from "../lib/storage";

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
        const { data: authData, error: authError } =
          await supabase.auth.getUser();

        if (authError || !authData?.user) {
          throw new Error("Unable to load current user profile.");
        }

        const user = authData.user;

        const { data: userProfile, error: profileError } = await supabase
          .from("user_profiles")
          .select("id, full_name, sr_code, campus_role, block, avatar_url")
          .eq("id", user.id)
          .maybeSingle();

        if (!isMounted) return;

        if (profileError || !userProfile) {
          setProfile(buildFallbackProfile(user));
        } else {
          setProfile({
            ...userProfile,
            email: user.email || "No email",
          });
        }

        const [followersResult, followingResult] = await Promise.all([
          supabase
            .from("user_follows")
            .select("follower_id", { count: "exact", head: true })
            .eq("following_id", user.id),
          supabase
            .from("user_follows")
            .select("following_id", { count: "exact", head: true })
            .eq("follower_id", user.id),
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
    <div className="min-h-screen bg-gradient-to-b from-[#f8f9fb] to-[#f2f4f7] p-3 sm:p-4 lg:p-6">
      <div className="mx-auto flex w-full max-w-[1040px] flex-col gap-4">
        <Header />

        <main className="border-t border-slate-200 pt-5" role="main">
          <section className="overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_14px_30px_rgba(15,23,42,0.08)]">
            <div className="bg-slate-900 px-6 py-8 text-white">
              <p className="m-0 text-xs uppercase tracking-[0.12em] text-slate-300">
                User Profile
              </p>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h2 className="m-0 text-[1.9rem] font-semibold">
                    {isLoading ? "Loading profile..." : profile?.full_name}
                  </h2>
                  <p className="m-0 mt-1 text-sm text-slate-300">
                    Account center for your governance identity.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditOpen(true)}
                  className="inline-flex shrink-0 items-center justify-center rounded-[12px] bg-white/10 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/15"
                >
                  Edit profile
                </button>
              </div>
            </div>

            <div className="grid gap-4 p-6 md:grid-cols-[220px_1fr]">
              <div className="flex flex-col items-center rounded-[14px] border border-slate-200 bg-slate-50 p-4 text-center">
                <div className="h-24 w-24 overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Profile avatar"
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[#7f1d1d] text-2xl font-semibold text-white">
                      {initials || "U"}
                    </div>
                  )}
                </div>
                <p className="m-0 mt-3 text-sm font-semibold text-slate-900">
                  {isLoading ? "..." : profile?.full_name}
                </p>
                <p className="m-0 mt-1 text-xs text-slate-500">
                  {isLoading ? "..." : profile?.campus_role || "student"}
                </p>
              </div>

              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <article className="rounded-[12px] border border-slate-200 bg-white p-3">
                    <p className="m-0 text-xs uppercase tracking-[0.08em] text-slate-500">
                      SR Code
                    </p>
                    <p className="m-0 mt-1 flex items-center gap-1 text-sm font-semibold text-slate-900">
                      <Hash size={14} />
                      {isLoading
                        ? "Loading..."
                        : profile?.sr_code || "No SR Code"}
                    </p>
                  </article>

                  <article className="rounded-[12px] border border-slate-200 bg-white p-3">
                    <p className="m-0 text-xs uppercase tracking-[0.08em] text-slate-500">
                      Block
                    </p>
                    <p className="m-0 mt-1 flex items-center gap-1 text-sm font-semibold text-slate-900">
                      <GraduationCap size={14} />
                      {isLoading
                        ? "Loading..."
                        : profile?.block || "Unassigned"}
                    </p>
                  </article>

                  <article className="rounded-[12px] border border-slate-200 bg-white p-3 sm:col-span-2">
                    <p className="m-0 text-xs uppercase tracking-[0.08em] text-slate-500">
                      Email
                    </p>
                    <p className="m-0 mt-1 flex items-center gap-1 text-sm font-semibold text-slate-900">
                      <AtSign size={14} />
                      {isLoading ? "Loading..." : profile?.email || "No email"}
                    </p>
                  </article>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <article className="rounded-[12px] border border-slate-200 bg-white p-3">
                    <p className="m-0 text-xs uppercase tracking-[0.08em] text-slate-500">
                      Followers
                    </p>
                    <p className="m-0 mt-1 flex items-center gap-1 text-sm font-semibold text-slate-900">
                      <Users size={14} />
                      {followersCount}
                    </p>
                  </article>

                  <article className="rounded-[12px] border border-slate-200 bg-white p-3">
                    <p className="m-0 text-xs uppercase tracking-[0.08em] text-slate-500">
                      Following
                    </p>
                    <p className="m-0 mt-1 flex items-center gap-1 text-sm font-semibold text-slate-900">
                      <UserRound size={14} />
                      {followingCount}
                    </p>
                  </article>
                </div>
              </div>
            </div>
          </section>

          {/* ── Saved Posts ─────────────────────────────────────────── */}
          <section className="mt-4 overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_14px_30px_rgba(15,23,42,0.08)]">
            <div className="flex items-center gap-2 border-b border-slate-200 px-6 py-4">
              <Bookmark size={18} className="text-slate-600" />
              <h3 className="m-0 text-lg font-semibold text-slate-900">Saved Posts</h3>
            </div>

            <div className="p-4">
              {savedLoading ? (
                <p className="m-0 py-4 text-center text-sm text-slate-400">Loading saved posts...</p>
              ) : savedPosts.length === 0 ? (
                <p className="m-0 py-4 text-center text-sm text-slate-400">
                  No saved posts yet. Bookmark discussions from the forum to find them here.
                </p>
              ) : (
                <div className="space-y-2">
                  {savedPosts.map((post) => (
                    <div
                      key={post.id}
                      onClick={() => navigate(`/hub?post=${post.id}`)}
                      className="flex cursor-pointer items-center gap-3 rounded-[12px] border border-slate-200 bg-slate-50 px-4 py-3 transition-colors hover:bg-slate-100"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="m-0 text-sm font-semibold text-slate-900 truncate">
                          {post.title}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                          <span className="inline-flex rounded bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 font-medium">
                            {post.tag || "General"}
                          </span>
                          <span>{parseInt(post.score, 10) || 0} votes</span>
                          <span>•</span>
                          <span>{parseInt(post.comment_count, 10) || 0} comments</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUnsave(post.id);
                        }}
                        className="shrink-0 inline-flex items-center gap-1 rounded-[8px] px-2.5 py-1.5 text-[11px] font-semibold text-amber-700 bg-amber-50 transition-colors hover:bg-amber-100"
                        title="Remove from saved"
                      >
                        <Bookmark size={12} fill="currentColor" />
                        Unsave
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </main>
      </div>

      <EditProfileModal
        isOpen={isEditOpen}
        initialProfile={profile}
        onClose={() => setIsEditOpen(false)}
        onSave={async ({ sr_code, block, avatarFile }) => {
          const { data: authData, error: authError } = await supabase.auth.getUser();
          if (authError || !authData?.user) {
            alert("You must be logged in.");
            return false;
          }

          let avatarUrl = profile?.avatar_url || null;
          if (avatarFile) {
            try {
              avatarUrl = await uploadPublicImage({
                bucket: "user-avatars",
                pathPrefix: `${authData.user.id}`,
                file: avatarFile,
                upsert: true,
              });
            } catch (error) {
              alert(error?.message || "Failed to upload avatar.");
              return false;
            }
          }

          const { data: updated, error } = await supabase
            .from("user_profiles")
            .update({
              sr_code,
              block,
              avatar_url: avatarUrl,
            })
            .eq("id", authData.user.id)
            .select("id, full_name, sr_code, campus_role, block, avatar_url")
            .maybeSingle();

          if (error) {
            alert(error.message || "Failed to update profile.");
            return false;
          }

          if (updated) {
            const cacheBust =
              updated.avatar_url && avatarFile
                ? `${updated.avatar_url}${updated.avatar_url.includes("?") ? "&" : "?"}t=${Date.now()}`
                : updated.avatar_url;
            setProfile((prev) => ({
              ...(prev || {}),
              ...updated,
              avatar_url: cacheBust,
              email: authData.user.email || prev?.email || "No email",
            }));
          }

          return true;
        }}
      />
    </div>
  );
}

export default ProfilePage;
