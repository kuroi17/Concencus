import { useState, useEffect } from "react";
import Header from "../common/Header";
import ProposalBoard from "../components/ProposalComponents/ProposalBoard";
import ProposalsSidebar from "../components/ProposalComponents/ProposalsSidebar";
import CreateProposalModal from "../components/ProposalComponents/CreateProposalModal";
import { useChannel } from "../context/useChannel";
import { useCurrentUserProfile } from "../hooks/useCurrentUserProfile";
import { supabase } from "../lib/supabaseClient";
import { createSocketClient } from "../lib/socketClient";
import { uploadPublicImage } from "../lib/storage";
import toast from "react-hot-toast";

function ProposalsPage() {
  const { currentChannel } = useChannel();
  const { isAdmin } = useCurrentUserProfile();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [socket, setSocket] = useState(null);

  // ── Socket connection ─────────────────────────────────────────
  useEffect(() => {
    let isDisposed = false;
    let client = null;
    const connect = async () => {
      const { data: authData } = await supabase.auth.getSession();
      const token = authData.session?.access_token;
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

  const handleCreateProposal = async (proposalData) => {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    if (!user || !currentChannel) return;

    const { imageFiles, isAnonymous, sdgTag, ...rest } = proposalData;

    // 1. Insert proposal base data
    const { data: insertedProposal, error: insertError } = await supabase
      .from("proposals")
      .insert([{
        ...rest,
        sdg_tag: sdgTag,
        is_anonymous: isAnonymous,
        author_id: user.id,
        channel_id: currentChannel.id
      }])
      .select(`
        *,
        author:user_profiles!author_id(full_name, avatar_url)
      `)
      .single();

    if (insertError) {
      console.error("Error creating proposal:", insertError);
      toast.error("Failed to create proposal: " + insertError.message);
      return;
    }

    // 2. Upload images if any
    const files = imageFiles || [];
    if (files.length > 0 && insertedProposal?.id) {
      const uploadedUrls = [];
      for (const file of files) {
        const url = await uploadPublicImage(file, "forum-post-images");
        if (url) uploadedUrls.push(url);
      }

      if (uploadedUrls.length > 0) {
        await supabase
          .from("proposals")
          .update({
            image_url: uploadedUrls[0],
            image_urls: uploadedUrls,
          })
          .eq("id", insertedProposal.id);
      }
    }
    
    toast.success("Proposal submitted successfully!");
    setIsModalOpen(false);
  };

  if (!currentChannel) return null;

  return (
    <div className="grid min-h-screen grid-cols-1 gap-4 bg-gradient-to-b from-[#f8f9fb] to-[#f2f4f7] p-3 sm:p-4 lg:grid-cols-[250px_1fr] lg:p-6">
      <ProposalsSidebar onOpenModal={() => setIsModalOpen(true)} />

      <div className="flex flex-col gap-4">
        <Header />

        <main className="flex-1 py-2" role="main">
          <section className="space-y-4 border-t border-slate-200 pt-4 sm:pt-5">
            <header className="soft-enter">
              <p className="m-0 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                Governance Channel
              </p>
              <h2 className="m-0 mt-1 text-[1.9rem] font-semibold leading-tight text-slate-900 sm:text-[2.25rem] lg:text-[2.55rem]">
                {currentChannel.name} Proposals
              </h2>
              <p className="m-0 mt-1 text-sm text-slate-600">
                Shape the future of your campus. Vote, discuss, and track the implementation of institutional changes.
              </p>
            </header>

            <div className="mt-6">
              <ProposalBoard 
                channelId={currentChannel.id} 
                isAdmin={isAdmin} 
                socket={socket} 
              />
            </div>
          </section>
        </main>
      </div>

      <CreateProposalModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleCreateProposal}
      />
    </div>
  );
}

export default ProposalsPage;
