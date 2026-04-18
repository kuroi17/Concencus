import { useEffect, useMemo, useState } from "react";
import Header from "../common/Header";
import ChatSidebar from "../components/ChatComponents/ChatSidebar";
import ChatThread from "../components/ChatComponents/ChatThread";
import { useDmConversations } from "../hooks/useDmConversations";
import { useDmMessages } from "../hooks/useDmMessages";
import { createSocketClient } from "../lib/socketClient";
import { supabase } from "../lib/supabaseClient";

function buildFallbackProfile(user) {
  return {
    full_name: user?.user_metadata?.full_name || user?.email || "Authenticated User",
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
  } = useDmMessages(activeConversationId, socket);

  const activeConversation = useMemo(() => {
    if (!activeConversationId) return null;
    return conversationMap.get(activeConversationId) || null;
  }, [conversationMap, activeConversationId]);

  useEffect(() => {
    let isMounted = true;

    const loadCurrentUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!isMounted) return;
      if (error || !data.user) return;

      setCurrentUser(data.user);
    };

    loadCurrentUser();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!currentUser?.id) {
      queueMicrotask(() => {
        setCurrentUserProfile(null);
      });
      return;
    }

    let isMounted = true;

    const loadProfile = async () => {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("id, full_name, sr_code, campus_role, block")
        .eq("id", currentUser.id)
        .maybeSingle();

      if (!isMounted) return;

      if (error || !data) {
        setCurrentUserProfile(buildFallbackProfile(currentUser));
        return;
      }

      setCurrentUserProfile(data);
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser?.id) {
      queueMicrotask(() => {
        setSocketStatus("disconnected");
      });
      return undefined;
    }

    let isDisposed = false;
    let client = null;

    const connectSocket = async () => {
      setSocketStatus("connecting");

      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (!token || isDisposed) {
        setSocketStatus("disconnected");
        return;
      }

      client = createSocketClient(token);

      client.on("connect", () => {
        if (isDisposed) return;
        setSocketStatus("connected");
      });

      client.on("disconnect", () => {
        if (isDisposed) return;
        setSocketStatus("disconnected");
      });

      client.on("connect_error", () => {
        if (isDisposed) return;
        setSocketStatus("disconnected");
      });

      if (!isDisposed) {
        setSocket(client);
      }
    };

    connectSocket();

    return () => {
      isDisposed = true;

      if (client) {
        client.removeAllListeners();
        client.disconnect();
      }

      setSocket(null);
    };
  }, [currentUser?.id]);

  useEffect(() => {
    if (!activeConversationId && conversations.length > 0) {
      queueMicrotask(() => {
        setActiveConversationId(conversations[0].id);
      });
      return;
    }

    if (
      activeConversationId &&
      conversations.length > 0 &&
      !conversations.some((item) => item.id === activeConversationId)
    ) {
      queueMicrotask(() => {
        setActiveConversationId(conversations[0].id);
      });
    }
  }, [activeConversationId, conversations]);

  useEffect(() => {
    if (!currentUser?.id) {
      queueMicrotask(() => {
        setSearchResults([]);
        setIsSearchingProfiles(false);
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

    const timeoutId = setTimeout(async () => {
      setIsSearchingProfiles(true);

      const safeTerm = term.replace(/[,%]/g, "");

      const { data, error } = await supabase
        .from("user_profiles")
        .select("id, full_name, sr_code, campus_role, block")
        .or(`full_name.ilike.%${safeTerm}%,sr_code.ilike.%${safeTerm}%`)
        .neq("id", currentUser.id)
        .limit(8);

      if (isCancelled) return;

      if (error) {
        setSearchResults([]);
      } else {
        setSearchResults(data || []);
      }

      setIsSearchingProfiles(false);
    }, 250);

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, [searchQuery, currentUser?.id]);

  const handleSelectSearchResult = async (profile) => {
    if (!profile?.id) return;

    setIsOpeningConversation(true);

    try {
      const conversation = await createOrGetConversation(profile.id);

      setActiveConversationId(conversation.id);
      setSearchQuery("");
      setSearchResults([]);
    } finally {
      setIsOpeningConversation(false);
    }
  };

  const handleSendMessage = async (text) => {
    const content = text.trim();

    if (!content) {
      throw new Error("Message cannot be empty.");
    }

    if (!activeConversationId) {
      throw new Error("Please select a conversation first.");
    }

    if (!socket || socketStatus !== "connected") {
      throw new Error("Chat service is offline. Please try again.");
    }

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
        {
          conversationId: activeConversationId,
          body: content,
          clientMessageId,
        },
        async (response) => {
          clearTimeout(timeoutId);

          if (response?.ok && response.message) {
            replaceOptimisticMessage(clientMessageId, response.message);
            await refreshConversations();
            resolve(response.message);
            return;
          }

          removeOptimisticMessage(clientMessageId);
          reject(new Error(response?.error || "Failed to send message."));
        },
      );
    });
  };

  return (
    <div className="grid min-h-screen grid-cols-1 gap-4 bg-gradient-to-b from-[#f8f9fb] to-[#f2f4f7] p-3 sm:p-4 lg:grid-cols-[230px_1fr] lg:p-6">
      <ChatSidebar
        currentUser={currentUserProfile || buildFallbackProfile(currentUser)}
        conversations={conversations}
        activeConversationId={activeConversationId}
        isLoadingConversations={isLoadingConversations}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        searchResults={searchResults}
        isSearchingProfiles={isSearchingProfiles}
        onSelectSearchResult={handleSelectSearchResult}
        onSelectConversation={setActiveConversationId}
      />

      <div className="flex flex-col gap-4">
        <Header />

        <main className="flex-1 py-2" role="main">
          <section className="border-t border-slate-200 pt-5">
            {conversationsError && (
              <p className="mb-3 rounded-[10px] border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
                {conversationsError}
              </p>
            )}

            <ChatThread
              conversation={activeConversation}
              messages={messages}
              currentUserId={currentUser?.id}
              isLoadingMessages={isLoadingMessages}
              messagesError={messagesError}
              socketStatus={socketStatus}
              onSendMessage={handleSendMessage}
              isOpeningConversation={isOpeningConversation}
            />
          </section>
        </main>
      </div>
    </div>
  );
}

export default ChatPage;
