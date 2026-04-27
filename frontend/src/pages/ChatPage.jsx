import { useCallback, useEffect, useMemo, useState } from "react";
import { MessageSquare, Search, X } from "lucide-react";
import ChatThread from "../components/ChatComponents/ChatThread";
import ConversationListPanel from "../components/ChatComponents/ConversationListPanel";
import { useDmConversations } from "../hooks/useDmConversations";
import { useDmMessages } from "../hooks/useDmMessages";
import { useUnreadCounts } from "../hooks/useUnreadCounts";
import { createSocketClient } from "../lib/socketClient";
import { supabase } from "../lib/supabaseClient";
import MainLayout from "../components/layouts/MainLayout";
import { useUser } from "../context/UserContext";

function ChatPage() {
  const { user: currentUser } = useUser();
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchingProfiles, setIsSearchingProfiles] = useState(false);
  const [socket, setSocket] = useState(null);
  const [socketStatus, setSocketStatus] = useState("connecting");
  const [isOpeningConversation, setIsOpeningConversation] = useState(false);

  const currentUserId = currentUser?.id;

  const {
    conversations = [],
    conversationMap = new Map(),
    isLoadingConversations = false,
    refreshConversations,
    createOrGetConversation,
  } = useDmConversations(currentUserId);

  const {
    messages = [],
    isLoadingMessages = false,
    messagesError = "",
    appendOptimisticMessage,
    replaceOptimisticMessage,
    removeOptimisticMessage,
    reactionsByMessage = new Map(),
    toggleReaction,
    deleteMessage,
  } = useDmMessages(activeConversationId, socket);

  const { unreadCounts = new Map(), markAsRead, refreshUnreadCounts } = useUnreadCounts(currentUserId);

  const activeConversation = useMemo(() => {
    if (!activeConversationId || !conversationMap) return null;
    return conversationMap.get(activeConversationId) || null;
  }, [conversationMap, activeConversationId]);

  // ── Socket connection ─────────────────────────────────────────
  useEffect(() => {
    if (!currentUserId) {
      queueMicrotask(() => {
        setSocketStatus("disconnected");
      });
      return undefined;
    }
    
    let isDisposed = false;
    let client = null;

    const connect = async () => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token || isDisposed) {
        setSocketStatus("disconnected");
        return;
      }
      client = createSocketClient(token);
      client.on("connect", () => { if (!isDisposed) setSocketStatus("connected"); });
      client.on("disconnect", (reason) => {
        if (isDisposed) return;
        setSocketStatus(reason === "io server disconnect" ? "disconnected" : "connecting");
      });
      client.on("connect_error", () => { if (!isDisposed) setSocketStatus("connecting"); });
      if (!isDisposed) setSocket(client);
    };

    connect();

    return () => {
      isDisposed = true;
      if (client) {
        client.removeAllListeners();
        client.io.removeAllListeners();
        client.disconnect();
      }
      setSocket(null);
    };
  }, [currentUserId]);

  // ── Search users ──────────────────────────────────────────────
  useEffect(() => {
    if (!currentUserId) {
      queueMicrotask(() => {
        setSearchResults([]);
      });
      return;
    }
    const term = searchQuery.trim();
    if (term.length < 2) {
      queueMicrotask(() => {
        setSearchResults([]);
        setIsSearchingProfiles(false);
      });
      return;
    }

    let isCancelled = false;
    const id = setTimeout(async () => {
      setIsSearchingProfiles(true);
      const safe = term.replace(/[,%]/g, "");
      const { data, error } = await supabase
        .from("user_profiles")
        .select("id, full_name, sr_code, campus_role, block, avatar_url")
        .or(`full_name.ilike.%${safe}%,sr_code.ilike.%${safe}%`)
        .neq("id", currentUserId)
        .limit(8);
      
      if (isCancelled) return;
      setSearchResults(error ? [] : (data || []));
      setIsSearchingProfiles(false);
    }, 250);

    return () => { isCancelled = true; clearTimeout(id); };
  }, [searchQuery, currentUserId]);

  // ── Handlers ──────────────────────────────────────────────────
  const handleOpenConversation = useCallback(
    (conversationId) => {
      setActiveConversationId(conversationId);
      if (conversationId && markAsRead) markAsRead(conversationId);
    },
    [markAsRead],
  );

  const handleSelectSearchResult = async (profile) => {
    if (!profile?.id) return;
    setIsOpeningConversation(true);
    try {
      const conversation = await createOrGetConversation(profile.id);
      setActiveConversationId(conversation.id);
      if (markAsRead) markAsRead(conversation.id);
      setSearchQuery("");
      setSearchResults([]);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setIsOpeningConversation(false);
    }
  };

  const handleSendMessage = async (text) => {
    const content = text.trim();
    if (!content || !activeConversationId || !socket || socketStatus !== "connected") return;

    const clientMessageId = `client-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    appendOptimisticMessage({
      id: clientMessageId,
      conversation_id: activeConversationId,
      sender_id: currentUserId,
      recipient_id: activeConversation?.otherUserId || null,
      body: content,
      client_message_id: clientMessageId,
      created_at: new Date().toISOString(),
    });

    socket.emit("message:send", { conversationId: activeConversationId, body: content, clientMessageId }, async (res) => {
      if (res?.ok && res.message) {
        replaceOptimisticMessage(clientMessageId, res.message);
        if (refreshConversations) refreshConversations({ silent: true });
        if (refreshUnreadCounts) refreshUnreadCounts();
      } else {
        removeOptimisticMessage(clientMessageId);
      }
    });
  };

  const chatSearchSlot = (
    <div className="relative w-full">
      <Search
        size={16}
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
      />
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search"
        className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 py-2.5 pl-10 pr-10 text-sm font-medium text-slate-700 dark:text-slate-200 outline-none transition-all focus:border-[#800000] focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-red-900/5"
      />
      {searchQuery && (
        <button
          type="button"
          onClick={() => setSearchQuery("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );

  return (
    <MainLayout
      title="Communications"
      searchSlot={chatSearchSlot}
      sidebarSlot={
        <div className="flex h-full flex-col p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">
              Communications
            </h2>
           
          </div>
          <div className="flex-1 min-h-0">
            <ConversationListPanel
              conversations={conversations}
              isLoadingConversations={isLoadingConversations}
              onOpenConversation={handleOpenConversation}
              activeConversationId={activeConversationId}
              unreadCounts={unreadCounts}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              searchResults={searchResults}
              isSearchingProfiles={isSearchingProfiles}
              isOpeningConversation={isOpeningConversation}
              onSelectSearchResult={handleSelectSearchResult}
            />
          </div>
        </div>
      }
    >
      <div className="flex h-[calc(100vh-96px)] overflow-hidden">
        <div className="flex min-w-0 flex-1 flex-col rounded-[32px] border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 shadow-xl shadow-slate-900/5 overflow-hidden">
          {activeConversationId ? (
            <ChatThread
              conversation={activeConversation}
              messages={messages}
              currentUserId={currentUserId}
              isLoadingMessages={isLoadingMessages}
              messagesError={messagesError}
              socketStatus={socketStatus}
              onSendMessage={handleSendMessage}
              isOpeningConversation={isOpeningConversation}
              onBack={() => setActiveConversationId(null)}
              reactionsByMessage={reactionsByMessage}
              onToggleReaction={(messageId, emoji) => toggleReaction?.({ messageId, emoji, currentUserId })}
              onDeleteMessage={deleteMessage}
            />
          ) : (
            <div className="flex h-full flex-col bg-slate-50/50 dark:bg-slate-950/50">
              <div className="flex-1 min-h-0 flex flex-col">
                {/* Mobile: Show conversations list if none selected */}
                <div className="lg:hidden flex h-full flex-col p-4 bg-white dark:bg-slate-900">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">
                      Communications
                    </h2>
                    <div className="h-1.5 w-10 rounded-full bg-[#800000]" />
                  </div>
                  
                  {/* Mobile Search Bar */}
                  <div className="relative mb-4">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 py-2 pl-9 text-sm outline-none focus:border-[#800000]"
                    />
                  </div>

                  <div className="flex-1 min-h-0">
                    <ConversationListPanel
                      conversations={conversations}
                      isLoadingConversations={isLoadingConversations}
                      onOpenConversation={handleOpenConversation}
                      activeConversationId={activeConversationId}
                      unreadCounts={unreadCounts}
                      searchQuery={searchQuery}
                      onSearchChange={setSearchQuery}
                      searchResults={searchResults}
                      isSearchingProfiles={isSearchingProfiles}
                      isOpeningConversation={isOpeningConversation}
                      onSelectSearchResult={handleSelectSearchResult}
                    />
                  </div>
                </div>

                {/* Desktop: Show Empty State */}
                <div className="hidden lg:flex flex-1 flex-col items-center justify-center text-center p-12">
                  <div className="h-24 w-24 rounded-[40px] bg-white dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600 mb-8 shadow-sm">
                    <MessageSquare size={48} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">Your Inbox</h3>
                  <p className="mt-4 max-w-sm text-base font-medium text-slate-400 dark:text-slate-500 leading-relaxed">
                    Select a student from the list or search to start a new discussion.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

export default ChatPage;
