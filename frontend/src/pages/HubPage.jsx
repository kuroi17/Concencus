import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import MainLayout from "../components/layouts/MainLayout";
import TabSwitcher from "../components/common/TabSwitcher";
import AnnouncementBoard from "../components/AnnouncementComponents/AnnouncementBoard";
import ForumBoard from "../components/ForumComponents/ForumBoard";
import ForumInfoPanel from "../components/ForumComponents/ForumInfoPanel";
import CreatePostModal from "../components/ForumComponents/CreatePostModal";
import ProposalBoard from "../components/ProposalComponents/ProposalBoard";
import { useChannel } from "../context/useChannel";
import { supabase } from "../lib/supabaseClient";
import { createSocketClient } from "../lib/socketClient";
import { uploadPublicImage } from "../lib/storage";
import { useCurrentUserProfile } from "../hooks/useCurrentUserProfile";
import toast from "react-hot-toast";
import OnboardingModal from "../components/ProfileComponents/OnboardingModal";

function HubPage() {
  const [hasDismissedOnboarding, setHasDismissedOnboarding] = useState(false);
  const [searchParams] = useSearchParams();
  const { currentChannel } = useChannel();
  const { isAdmin, currentUser, profile } = useCurrentUserProfile();
  const [view, setView] = useState(searchParams.has("post") ? "forum" : "announcement");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [socket, setSocket] = useState(null);

  // ── Socket connection ─────────────────────────────────────────
  useEffect(() => {
    let isDisposed = false;
    let client = null;
    const connect = async () => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token || isDisposed) return;
      client = createSocketClient(token);
      if (!isDisposed) setSocket(client);
    };
    connect();
    return () => {
      isDisposed = true;
      if (client) { client.removeAllListeners(); client.io.removeAllListeners(); client.disconnect(); }
      setSocket(null);
    };
  }, []);

  // ── Create Post ─────────────────────────────────────────────────────────
  const handleCreatePost = async (postData) => {
    try {
      if (!currentUser) {
        toast.error("You must be logged in to post.");
        return;
      }

      const { data: insertedPost, error: insertError } = await supabase
        .from("forum_posts")
        .insert([
          {
            channel_id: currentChannel.id,
            author_id: currentUser.id,
            title: postData.title,
            excerpt: postData.excerpt,
            tag: postData.tag,
            is_anonymous: postData.isAnonymous,
          },
        ])
        .select("id")
        .single();

      if (insertError) throw insertError;

      const files = postData?.imageFiles || [];
      if (files.length > 0 && insertedPost?.id) {
        const uploadedUrls = [];
        for (const file of files) {
          const url = await uploadPublicImage({ file, bucketName: "forum-post-images" });
          if (url) uploadedUrls.push(url);
        }

        if (uploadedUrls.length > 0) {
          const { error: updateError } = await supabase
            .from("forum_posts")
            .update({
              image_url: uploadedUrls[0],
              image_urls: uploadedUrls,
            })
            .eq("id", insertedPost.id);

          if (updateError) throw updateError;
        }
      }

      setRefreshKey((k) => k + 1);
      setIsModalOpen(false);
      toast.success("Post created successfully!");
    } catch (err) {
      console.error("Error creating post:", err);
      toast.error("Failed to create post.");
    }
  };

  if (!currentChannel) return null;

  return (
    <MainLayout>
      <section className="mb-6 space-y-5 pt-4 sm:pt-6">
        {/* ── Channel hero header ─────────────────────────────── */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2 min-w-0">
            {/* Category / breadcrumb chip */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#800000]/8 dark:bg-[#800000]/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#800000] dark:text-red-400 border border-[#800000]/15 dark:border-[#800000]/30">
                <span className="h-1.5 w-1.5 rounded-full bg-[#800000] dark:bg-red-400" />
                Active Channel
              </span>
            </div>
            <h2 className="m-0 text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              {currentChannel.name}
            </h2>
            <p className="max-w-xl text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
              {currentChannel.description || "Explore announcements, join the discussion, and submit proposals for this channel."}
            </p>
          </div>

          {/* Tab switcher — right-aligned on sm+ */}
          <div className="shrink-0 self-start">
            <TabSwitcher view={view} onChangeView={setView} />
          </div>
        </header>

        {/* Separator */}
        <div className="h-px w-full bg-gradient-to-r from-[#800000]/20 via-slate-200 to-transparent dark:from-[#800000]/20 dark:via-slate-800 dark:to-transparent" />

        {view === "announcement" ? (
          <div className="soft-rise">
            <AnnouncementBoard channelId={currentChannel.id} />
          </div>
        ) : view === "forum" ? (
          <div className="soft-rise grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-4">
              {/* Mobile-only inline Start Discussion button (hidden on xl where the side panel has it) */}
              <div className="xl:hidden flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  aria-label="Start Discussion"
                  className="flex items-center gap-2 rounded-2xl bg-[#800000] px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-red-900/25 transition-all hover:-translate-y-0.5 hover:bg-[#a00000] active:translate-y-0 active:scale-95"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><line x1="12" y1="8" x2="12" y2="14"/><line x1="9" y1="11" x2="15" y2="11"/></svg>
                  Start Discussion
                </button>
              </div>
              <ForumBoard channelId={currentChannel.id} refreshKey={refreshKey} />
            </div>
            <aside className="hidden xl:block">
              <ForumInfoPanel onOpenModal={() => setIsModalOpen(true)} />
            </aside>
          </div>
        ) : (
          <div className="soft-rise">
            <ProposalBoard channelId={currentChannel.id} isAdmin={isAdmin} socket={socket} />
          </div>
        )}
      </section>




      <CreatePostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreatePost}
      />

      {currentUser && profile && !profile.has_completed_onboarding && !hasDismissedOnboarding && (
        <OnboardingModal 
          isOpen={true} 
          onClose={() => setHasDismissedOnboarding(true)} 
          userProfile={profile} 
        />
      )}
    </MainLayout>
  );
}

export default HubPage;
