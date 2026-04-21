import Header from "../common/Header";
import ForumBoard from "../components/ForumComponents/ForumBoard";
import ForumInfoPanel from "../components/ForumComponents/ForumInfoPanel";
import ForumSidebar from "../components/ForumComponents/ForumSidebar";
import CreatePostModal from "../components/ForumComponents/CreatePostModal";
import { useState } from "react";

import { supabase } from "../lib/supabaseClient";
import { uploadPublicImage } from "../lib/storage";

function ForumPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreatePost = async (postData) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        alert("You must be logged in to post.");
        return;
      }

      // We might not have a channel yet, so fetch the first one or ignore
      const { data: channels } = await supabase.from("forum_channels").select("id").limit(1);

      if (!channels || channels.length === 0) {
        alert("No forum channels exist yet! Please run the migrations and insert a channel.");
        return;
      }

      const { data: insertedPost, error: insertError } = await supabase
        .from("forum_posts")
        .insert([
          {
            channel_id: channels[0].id,
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

      if (postData?.imageFile && insertedPost?.id) {
        const imageUrl = await uploadPublicImage({
          bucket: "forum-post-images",
          pathPrefix: `${userData.user.id}/${channels[0].id}/${insertedPost.id}`,
          file: postData.imageFile,
        });

        if (imageUrl) {
          const { error: updateError } = await supabase
            .from("forum_posts")
            .update({ image_url: imageUrl })
            .eq("id", insertedPost.id);

          if (updateError) throw updateError;
        }
      }
      console.log("Post created successfully!");
    } catch (err) {
      console.error("Error creating post:", err);
      alert("Failed to create post. Check console.");
    }
  };

  return (
    <>
      <div className="grid min-h-screen grid-cols-1 gap-4 bg-gradient-to-b from-[#f8f9fb] to-[#f2f4f7] p-3 sm:p-4 lg:grid-cols-[230px_1fr] lg:p-6">
        <ForumSidebar onOpenModal={() => setIsModalOpen(true)} />

        <div className="flex flex-col gap-4">
          <Header />

          <main className="flex-1 py-2" role="main">
            <section className="space-y-4 border-t border-slate-200 pt-4 sm:pt-5">
              <header className="soft-enter">
                <p className="m-0 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                  Undergraduate Programs
                </p>
                <h2 className="m-0 mt-1 text-[1.9rem] font-semibold leading-tight text-slate-900 sm:text-[2.25rem] lg:text-[2.55rem]">
                  BS Computer Science
                </h2>
                <p className="m-0 mt-1 text-sm text-slate-600">
                  Official channel for syllabus discussion, technical inquiries,
                  and program governance.
                </p>
              </header>

              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_290px]">
                <ForumBoard />
                <ForumInfoPanel onOpenModal={() => setIsModalOpen(true)} />
              </div>
            </section>
          </main>
        </div>
      </div>
      <CreatePostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreatePost}
      />
    </>
  );
}

export default ForumPage;
