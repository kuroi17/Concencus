import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import Header from "../common/Header";
import ChatSidebar from "../components/ChatComponents/ChatSidebar";
import ChatThread from "../components/ChatComponents/ChatThread";
import ConversationListPanel from "../components/ChatComponents/ConversationListPanel";
import { useDmConversations } from "../hooks/useDmConversations";
import { useDmMessages } from "../hooks/useDmMessages";
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
    if (
      activeConversationId &&
      conversations.length > 0 &&
      !conversations.some((item) => item.id === activeConversationId)
    ) {
      queueMicrotask(() => {
        setActiveConversationId(null);
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

  const hasSearchText = searchQuery.trim().length >= 2;

  const searchSlot = (
    <div className="relative max-w-[760px]">
      <Search
        size={18}
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
      />
      <input
        type="text"
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        placeholder="Search by name or SR code"
        className="w-full rounded-[14px] border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm text-slate-700 shadow-[0_8px_20px_rgba(15,23,42,0.05)] outline-none transition-all focus:border-slate-400 focus:shadow-[0_10px_26px_rgba(15,23,42,0.09)]"
      />

      {hasSearchText && (
        <div className="absolute left-0 top-[calc(100%+10px)] z-20 max-h-72 w-full overflow-y-auto rounded-[14px] border border-slate-200 bg-white p-1.5 shadow-[0_14px_32px_rgba(15,23,42,0.12)]">
          {isSearchingProfiles && (
            <p className="m-0 px-3 py-2 text-xs text-slate-500">Searching...</p>
          )}

          {!isSearchingProfiles &&
            searchResults.map((profile) => (
              <button
                key={profile.id}
                type="button"
                onClick={() => handleSelectSearchResult(profile)}
                className="flex w-full items-center gap-2 rounded-[8px] px-2 py-2 text-left transition-colors hover:bg-slate-100"
              >
                <div className="h-9 w-9 rounded-full bg-slate-800 text-center text-xs font-semibold leading-9 text-white">
                  {(profile.full_name || "?")
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0]?.toUpperCase())
                    .join("")}
                </div>

                <div className="min-w-0">
                  <p className="m-0 truncate text-sm font-semibold text-slate-800">
                    {profile.full_name}
                  </p>
                  <p className="m-0 truncate text-xs text-slate-500">
                    {profile.sr_code || "No SR Code"}
                  </p>
                </div>
              </button>
            ))}

          {!isSearchingProfiles && searchResults.length === 0 && (
            <p className="m-0 px-3 py-2 text-xs text-slate-500">
              No matching profiles found.
            </p>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="grid min-h-screen grid-cols-1 gap-4 bg-gradient-to-b from-[#f8f9fb] to-[#f2f4f7] p-3 sm:p-4 lg:grid-cols-[230px_1fr] lg:p-6">
      <ChatSidebar
        currentUser={currentUserProfile || buildFallbackProfile(currentUser)}
      />

      <div className="flex flex-col gap-4">
        <Header title="Direct Messages" searchSlot={searchSlot} />

        <main className="flex-1 py-2" role="main">
          <section className="pt-2">
            {conversationsError && (
              <p className="mb-3 rounded-[10px] border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
                {conversationsError}
              </p>
            )}

            {!activeConversation ? (
              <ConversationListPanel
                conversations={conversations}
                isLoadingConversations={isLoadingConversations}
                onOpenConversation={setActiveConversationId}
              />
            ) : (
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
              />
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

export default ChatPage;
