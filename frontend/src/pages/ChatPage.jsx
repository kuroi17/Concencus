import { useCallback, useEffect, useMemo, useState } from "react";
import Header from "../common/Header";
import ChatSidebar from "../components/ChatComponents/ChatSidebar";
import ChatThread from "../components/ChatComponents/ChatThread";
import ConversationListPanel from "../components/ChatComponents/ConversationListPanel";
import { useDmConversations } from "../hooks/useDmConversations";
import { useDmMessages } from "../hooks/useDmMessages";
import { useUnreadCounts } from "../hooks/useUnreadCounts";
import { createSocketClient } from "../lib/socketClient";
import { supabase } from "../lib/supabaseClient";

function buildFallbackProfile(user) {
  return {
    full_name:
      user?.user_metadata?.full_name || user?.email || "Authenticated User",
    sr_code: user?.user_metadata?.sr_code || "No SR Code",
  };
}

function ChatPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchingProfiles, setIsSearchingProfiles] = useState(false);
  const [socket, setSocket] = useState(null);
  const [socketStatus, setSocketStatus] = useState("connecting");
  const [isOpeningConversation, setIsOpeningConversation] = useState(false);

  const {
    conversations,
    conversationMap,
    isLoadingConversations,
    conversationsError,
    refreshConversations,
    createOrGetConversation,
  } = useDmConversations(currentUser?.id);

  const {
    messages,
    isLoadingMessages,
    messagesError,
    appendOptimisticMessage,
    replaceOptimisticMessage,
    removeOptimisticMessage,
    reactionsByMessage,
    toggleReaction,
    deleteMessage,
  } = useDmMessages(activeConversationId, socket);

  const { unreadCounts, markAsRead, refreshUnreadCounts } = useUnreadCounts(
    currentUser?.id,
  );

  const activeConversation = useMemo(() => {
    if (!activeConversationId) return null;
    return conversationMap.get(activeConversationId) || null;
  }, [conversationMap, activeConversationId]);

  // ── Load current user ─────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!isMounted || error || !data.user) return;
      setCurrentUser(data.user);
    };
    load();
    return () => { isMounted = false; };
  }, []);

  // ── Load current user profile ─────────────────────────────────
  useEffect(() => {
    if (!currentUser?.id) {
      queueMicrotask(() => {
        setCurrentUserProfile(null);
      });
      return;
    }
    let isMounted = true;
    const load = async () => {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("id, full_name, sr_code, campus_role, block")
        .eq("id", currentUser.id)
        .maybeSingle();
      if (!isMounted) return;
      setCurrentUserProfile(error || !data ? buildFallbackProfile(currentUser) : data);
    };
    load();
    return () => { isMounted = false; };
  }, [currentUser]);

  // ── Socket connection ─────────────────────────────────────────
  useEffect(() => {
    if (!currentUser?.id) {
      queueMicrotask(() => {
        setSocketStatus("disconnected");
      });
      return undefined;
    }
    let isDisposed = false;
    let client = null;
    const connect = async () => {
      setSocketStatus("connecting");
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token || isDisposed) { setSocketStatus("disconnected"); return; }
      client = createSocketClient(token);
      client.on("connect", () => { if (!isDisposed) setSocketStatus("connected"); });
      client.on("disconnect", (reason) => {
        if (isDisposed) return;
        // If socket.io will auto-reconnect, show connecting status
        if (reason === "io server disconnect") {
          setSocketStatus("disconnected");
        } else {
          setSocketStatus("connecting");
        }
      });
      client.on("connect_error", () => { if (!isDisposed) setSocketStatus("connecting"); });
      client.io.on("reconnect", () => { if (!isDisposed) setSocketStatus("connected"); });
      client.io.on("reconnect_failed", () => { if (!isDisposed) setSocketStatus("disconnected"); });
      if (!isDisposed) setSocket(client);
    };
    connect();
    return () => {
      isDisposed = true;
      if (client) { client.removeAllListeners(); client.io.removeAllListeners(); client.disconnect(); }
      setSocket(null);
    };
  }, [currentUser?.id]);

  // ── Guard: active convo removed ───────────────────────────────
  useEffect(() => {
    if (
      activeConversationId &&
      conversations.length > 0 &&
      !conversations.some((c) => c.id === activeConversationId)
    ) {
      queueMicrotask(() => {
        setActiveConversationId(null);
      });
    }
  }, [activeConversationId, conversations]);

  // ── Search users ──────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser?.id) {
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
        .select("id, full_name, sr_code, campus_role, block")
        .or(`full_name.ilike.%${safe}%,sr_code.ilike.%${safe}%`)
        .neq("id", currentUser.id)
        .limit(8);
      if (isCancelled) return;
      setSearchResults(error ? [] : (data || []));
      setIsSearchingProfiles(false);
    }, 250);

    return () => { isCancelled = true; clearTimeout(id); };
  }, [searchQuery, currentUser?.id]);

  // ── Handlers ──────────────────────────────────────────────────
  const handleOpenConversation = useCallback(
    (conversationId) => {
      setActiveConversationId(conversationId);
      if (conversationId) markAsRead(conversationId);
    },
    [markAsRead],
  );

  const handleSelectSearchResult = async (profile) => {
    if (!profile?.id) return;
    setIsOpeningConversation(true);
    try {
      const conversation = await createOrGetConversation(profile.id);
      setActiveConversationId(conversation.id);
      markAsRead(conversation.id);
      setSearchQuery("");
      setSearchResults([]);
    } finally {
      setIsOpeningConversation(false);
    }
  };

  const handleSendMessage = async (text) => {
    const content = text.trim();
    if (!content) throw new Error("Message cannot be empty.");
    if (!activeConversationId) throw new Error("Please select a conversation first.");
    if (!socket || socketStatus !== "connected")
      throw new Error("Chat service is offline. Please try again.");

    const clientMessageId = `client-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    appendOptimisticMessage({
      id: clientMessageId,
      conversation_id: activeConversationId,
      sender_id: currentUser.id,
      recipient_id: activeConversation?.otherUserId || null,
      body: content,
      client_message_id: clientMessageId,
      created_at: new Date().toISOString(),
    });

    await new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        removeOptimisticMessage(clientMessageId);
        reject(new Error("Message send timeout. Check your connection."));
      }, 12000);

      socket.emit(
        "message:send",
        { conversationId: activeConversationId, body: content, clientMessageId },
        async (response) => {
          clearTimeout(timeoutId);
          if (response?.ok && response.message) {
            replaceOptimisticMessage(clientMessageId, response.message);
            await refreshConversations();
            refreshUnreadCounts();
            resolve(response.message);
            return;
          }
          removeOptimisticMessage(clientMessageId);
          reject(new Error(response?.error || "Failed to send message."));
        },
      );
    });
  };

  const currentUserDisplay =
    currentUserProfile || buildFallbackProfile(currentUser);

  // ── Layout ────────────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f9fb]">
      {/* ── Left sidebar (search + conversations) ─────────────── */}
      <div
        className={`flex w-full shrink-0 flex-col border-r border-slate-200 bg-white lg:w-[320px] ${
          activeConversationId ? "hidden lg:flex" : "flex"
        }`}
      >
        <ChatSidebar currentUser={currentUserDisplay}>
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
        </ChatSidebar>
      </div>

      {/* ── Right area ────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top nav */}
        <Header title="Direct Messages" />

        {/* Error banner */}
        {conversationsError && (
          <p className="m-0 shrink-0 border-b border-rose-200 bg-rose-50 px-4 py-2 text-xs font-medium text-rose-700">
            {conversationsError}
          </p>
        )}

        {/* Thread panel
            Mobile: visible only when a conversation is active
            Desktop: always visible, fills remaining width      */}
        <div
          className={`flex min-h-0 flex-1 overflow-hidden ${
            activeConversationId ? "flex" : "hidden lg:flex"
          }`}
        >
          <div className="flex h-full w-full flex-col">
            <ChatThread
              conversation={activeConversation}
              messages={messages}
              currentUserId={currentUser?.id}
              isLoadingMessages={isLoadingMessages}
              messagesError={messagesError}
              socketStatus={socketStatus}
              onSendMessage={handleSendMessage}
              isOpeningConversation={isOpeningConversation}
              onBack={() => setActiveConversationId(null)}
              reactionsByMessage={reactionsByMessage}
              onToggleReaction={(messageId, emoji) =>
                toggleReaction({
                  messageId,
                  emoji,
                  currentUserId: currentUser?.id,
                })
              }
              onDeleteMessage={deleteMessage}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatPage;
