import { useState } from "react";
import Header from "../common/Header";
import ChannelSidebar from "../components/common/ChannelSidebar";
import TabSwitcher from "../components/common/TabSwitcher";
import AnnouncementBoard from "../components/AnnouncementComponents/AnnouncementBoard";
import ForumBoard from "../components/ForumComponents/ForumBoard";
import ForumInfoPanel from "../components/ForumComponents/ForumInfoPanel";
import CreatePostModal from "../components/ForumComponents/CreatePostModal";
import { useChannel } from "../context/useChannel";
import { supabase } from "../lib/supabaseClient";
import { uploadPublicImage } from "../lib/storage";

function HubPage() {
  const { currentChannel } = useChannel();
  const [view, setView] = useState("announcement");
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
            channel_id: currentChannel.id, // UUID from the channels table
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

      // Upload multiple images (up to 5)
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

      console.log("Post created successfully!");
      setRefreshKey((k) => k + 1); // trigger ForumBoard re-fetch
      setIsModalOpen(false);
    } catch (err) {
      console.error("Error creating post:", err);
      alert("Failed to create post. Check console.");
    }
  };

  return (
    <>
      {/* ── Shell ──────────────────────────────────────────────────────────── */}
      <div className="grid min-h-screen grid-cols-1 gap-0 bg-gradient-to-b from-[#f8f9fb] to-[#f2f4f7] lg:grid-cols-[240px_1fr]">
        {/* Sidebar */}
        <ChannelSidebar />

        {/* Main column */}
        <div className="flex flex-col gap-4 p-3 sm:p-4 lg:p-6">
          <Header />

          <main className="soft-enter flex-1 py-2" role="main">
            {/* Channel heading */}
            <section className="space-y-4 border-t border-slate-200 pt-4 sm:pt-5">
              <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="m-0 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                    {currentChannel.description}
                  </p>
                  <h2 className="m-0 mt-1 text-[1.9rem] font-semibold leading-tight text-slate-900 sm:text-[2.25rem] lg:text-[2.55rem]">
                    {currentChannel.name}
                  </h2>
                </div>

                {/* Tab switcher aligned to the right on larger screens */}
                <div className="shrink-0">
                  <TabSwitcher view={view} onChangeView={setView} />
                </div>
              </header>

              {/* ── Content area ────────────────────────────────────────── */}
              {view === "announcement" ? (
                <div className="soft-enter">
                  <AnnouncementBoard channelId={currentChannel.id} />
                </div>
              ) : (
                <div className="soft-enter grid gap-4 xl:grid-cols-[minmax(0,1fr)_290px]">
                  <ForumBoard channelId={currentChannel.id} refreshKey={refreshKey} />
                  <ForumInfoPanel onOpenModal={() => setIsModalOpen(true)} />
                </div>
              )}
            </section>
          </main>
        </div>
      </div>

      {/* Modal */}
      <CreatePostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreatePost}
      />
    </>
  );
}

export default HubPage;
