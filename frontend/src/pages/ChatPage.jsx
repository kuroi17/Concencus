import { useCallback, useEffect, useMemo, useState } from "react";
import { MessageSquare } from "lucide-react";
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

  return (
    <MainLayout
      title="Communications"
      sidebarSlot={
        <div className="flex h-full flex-col p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">
              Messages
            </h2>
            <div className="h-2 w-12 rounded-full bg-[#800000]" />
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
      <div className="flex h-[calc(100vh-120px)] pt-4 overflow-hidden">
        <div className={`flex min-w-0 flex-1 flex-col rounded-[32px] border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 shadow-xl dark:shadow-black/20 overflow-hidden ${activeConversationId ? "flex" : "hidden lg:flex"}`}>
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
            <div className="flex flex-1 flex-col items-center justify-center text-center p-12">
              <div className="h-20 w-20 rounded-[32px] bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600 mb-6">
                <MessageSquare size={40} />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Your Inbox</h3>
              <p className="mt-2 max-w-xs text-sm font-medium text-slate-400 dark:text-slate-500">
                Select a student from the list or search to start a new discussion.
              </p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

export default ChatPage;
