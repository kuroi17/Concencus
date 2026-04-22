import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import MainLayout from "../components/layouts/MainLayout";
import TabSwitcher from "../components/common/TabSwitcher";
import AnnouncementBoard from "../components/AnnouncementComponents/AnnouncementBoard";
import ForumBoard from "../components/ForumComponents/ForumBoard";
import ForumInfoPanel from "../components/ForumComponents/ForumInfoPanel";
import CreatePostModal from "../components/ForumComponents/CreatePostModal";
import { useChannel } from "../context/useChannel";
import { supabase } from "../lib/supabaseClient";
import { uploadPublicImage } from "../lib/storage";

function HubPage() {
  const [searchParams] = useSearchParams();
  const { currentChannel } = useChannel();
  const [view, setView] = useState(searchParams.has("post") ? "forum" : "announcement");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // ── Create Post ─────────────────────────────────────────────────────────
  const handleCreatePost = async (postData) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        alert("You must be logged in to post.");
        return;
      }

      const { data: insertedPost, error: insertError } = await supabase
        .from("forum_posts")
        .insert([
          {
            channel_id: currentChannel.id,
            author_id: userData.user.id,
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
          const url = await uploadPublicImage({
            bucket: "forum-post-images",
            pathPrefix: `${userData.user.id}/${currentChannel.id}/${insertedPost.id}`,
            file,
          });
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
    } catch (err) {
      console.error("Error creating post:", err);
      alert("Failed to create post.");
    }
  };

  if (!currentChannel) return null;

  return (
    <MainLayout>
      <section className="mb-6 space-y-6 pt-4 sm:pt-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-red-600 animate-pulse" />
              <p className="m-0 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                Active Governance Channel
              </p>
            </div>
            <h2 className="m-0 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              {currentChannel.name}
            </h2>
            <p className="max-w-2xl text-sm font-medium text-slate-500 leading-relaxed">
              {currentChannel.description}
            </p>
          </div>

          <div className="shrink-0 self-start sm:self-center">
            <TabSwitcher view={view} onChangeView={setView} />
          </div>
        </header>

        <div className="h-px w-full bg-gradient-to-r from-slate-200 via-slate-200 to-transparent" />

        {view === "announcement" ? (
          <div className="soft-rise">
            <AnnouncementBoard channelId={currentChannel.id} />
          </div>
        ) : (
          <div className="soft-rise grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-4">
              <ForumBoard channelId={currentChannel.id} refreshKey={refreshKey} />
            </div>
            <aside className="hidden xl:block">
              <ForumInfoPanel onOpenModal={() => setIsModalOpen(true)} />
            </aside>
          </div>
        )}
      </section>

      <CreatePostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreatePost}
      />
    </MainLayout>
  );
}

export default HubPage;
