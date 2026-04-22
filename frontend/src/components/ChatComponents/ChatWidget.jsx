import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { MessageSquare, X, Maximize2, Send, Search, ChevronLeft, Loader2, Smile, Settings, ExternalLink } from "lucide-react";
import { useDmConversations } from "../../hooks/useDmConversations";
import { useDmMessages } from "../../hooks/useDmMessages";
import { useUnreadCounts } from "../../hooks/useUnreadCounts";
import { createSocketClient } from "../../lib/socketClient";
import { supabase } from "../../lib/supabaseClient";
import { useNavigate, useLocation } from "react-router-dom";

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [socket, setSocket] = useState(null);
  const [messageInput, setMessageInput] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const messagesEndRef = useRef(null);

  // Hide on Chat Page
  if (location.pathname === "/chat") return null;

  const {
    conversations,
    conversationMap,
    isLoadingConversations,
    refreshConversations,
    createOrGetConversation,
  } = useDmConversations(currentUser?.id);

  const {
    messages,
    isLoadingMessages,
    appendOptimisticMessage,
    replaceOptimisticMessage,
    removeOptimisticMessage,
  } = useDmMessages(activeConversationId, socket);

  const { unreadCounts, markAsRead, refreshUnreadCounts } = useUnreadCounts(currentUser?.id);

  const activeConversation = useMemo(() => {
    if (!activeConversationId) return null;
    return conversationMap.get(activeConversationId) || null;
  }, [conversationMap, activeConversationId]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setCurrentUser(data.user);
    });
  }, []);

  useEffect(() => {
    if (!currentUser?.id) return;
    let client = null;
    supabase.auth.getSession().then(({ data }) => {
      const token = data.session?.access_token;
      if (token) {
        client = createSocketClient(token);
        setSocket(client);
      }
    });
    return () => client?.disconnect();
  }, [currentUser?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      const { data } = await supabase
        .from("user_profiles")
        .select("id, full_name, sr_code")
        .ilike("full_name", `%${searchQuery}%`)
        .neq("id", currentUser.id)
        .limit(5);
      setSearchResults(data || []);
      setIsSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, currentUser?.id]);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const content = messageInput.trim();
    if (!content || !activeConversationId || !socket) return;

    const clientId = `mini-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    appendOptimisticMessage({
      id: clientId,
      client_message_id: clientId,
      body: content,
      sender_id: currentUser.id,
      conversation_id: activeConversationId,
      created_at: new Date().toISOString(),
    });
    setMessageInput("");

    socket.emit("message:send", { conversationId: activeConversationId, body: content, clientMessageId: clientId }, (res) => {
      if (res?.ok) {
        replaceOptimisticMessage(clientId, res.message);
        refreshConversations();
        refreshUnreadCounts();
      } else {
        removeOptimisticMessage(clientId);
      }
    });
  };

  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  if (!currentUser) return null;

  return (
    <div className="fixed bottom-0 right-6 z-[100] flex flex-col items-end gap-0 pointer-events-none">
      {/* Dual Pane Chat Window */}
      {isOpen && (
        <div 
          className={`bg-white shadow-[0_-20px_50px_rgba(0,0,0,0.12)] rounded-t-[24px] overflow-hidden flex border-x border-t border-slate-200 transition-all duration-500 ease-in-out pointer-events-auto h-[480px] ${
            activeConversationId ? "w-[680px]" : "w-[320px]"
          }`}
        >
          {/* LEFT PANE: Conversations List */}
          <div className={`flex flex-col border-r border-slate-100 transition-all duration-500 ${activeConversationId ? "w-[240px]" : "w-full"}`}>
            <header className="bg-slate-900 px-4 py-3 flex items-center justify-between text-white shrink-0">
              <div className="flex items-center gap-2">
                <div className="bg-[#800000] p-1 rounded-lg">
                  <MessageSquare size={14} />
                </div>
                <span className="font-black text-[11px] uppercase tracking-widest">Chats</span>
              </div>
              {!activeConversationId && (
                <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1 rounded-lg transition-colors">
                  <X size={18} />
                </button>
              )}
            </header>

            <div className="flex-1 flex flex-col min-h-0 bg-white">
              <div className="p-3 shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-xl pl-9 pr-3 py-2 text-[11px] font-bold focus:ring-2 focus:ring-[#800000]/10 transition-all"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar px-2 space-y-0.5 pb-4">
                {searchQuery.trim() ? (
                  searchResults.map(profile => (
                    <button
                      key={profile.id}
                      onClick={async () => {
                        const convo = await createOrGetConversation(profile.id);
                        setActiveConversationId(convo.id);
                        setSearchQuery("");
                      }}
                      className="w-full flex items-center gap-2 p-2 hover:bg-slate-50 rounded-xl transition-all text-left"
                    >
                      <div className="h-8 w-8 shrink-0 rounded-full bg-[#800000]/10 text-[#800000] flex items-center justify-center font-black text-[10px] overflow-hidden">
                        {profile.avatar_url ? (
                          <img src={profile.avatar_url} className="h-full w-full object-cover" />
                        ) : profile.full_name[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-black text-slate-900 truncate">{profile.full_name}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter truncate">{profile.sr_code}</p>
                      </div>
                    </button>
                  ))
                ) : (
                  conversations.map(convo => {
                    const otherUser = convo.otherUser || {};
                    const lastMsg = convo.latestMessage;
                    const isLastMsgMine = lastMsg?.sender_id === currentUser.id;
                    const displayMsg = lastMsg 
                      ? `${isLastMsgMine ? "You: " : ""}${lastMsg.body}`
                      : "New chat";

                    return (
                      <button
                        key={convo.id}
                        onClick={() => {
                          setActiveConversationId(convo.id);
                          markAsRead(convo.id);
                        }}
                        className={`w-full flex items-center gap-2.5 p-2 rounded-xl transition-all text-left group ${
                          activeConversationId === convo.id ? "bg-slate-50 ring-1 ring-slate-100" : "hover:bg-slate-50/50"
                        }`}
                      >
                        <div className={`h-9 w-9 shrink-0 rounded-full flex items-center justify-center font-black text-[11px] transition-all overflow-hidden ${
                          activeConversationId === convo.id ? "bg-[#800000] text-white" : "bg-slate-100 text-slate-400 group-hover:bg-white"
                        }`}>
                          {otherUser.avatar_url ? (
                            <img src={otherUser.avatar_url} className="h-full w-full object-cover" />
                          ) : otherUser.full_name?.[0] || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <p className={`text-[11px] font-black truncate ${activeConversationId === convo.id ? "text-slate-900" : "text-slate-600"}`}>
                              {otherUser.full_name}
                            </p>
                            {unreadCounts[convo.id] > 0 && (
                              <span className="bg-[#800000] text-white text-[8px] font-black px-1 py-0.5 rounded-full">
                                {unreadCounts[convo.id]}
                              </span>
                            )}
                          </div>
                          <p className="text-[9px] text-slate-400 truncate font-bold mt-0.5">{displayMsg}</p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* RIGHT PANE: Chat Thread */}
          {activeConversationId && (
            <div className="flex-1 flex flex-col bg-slate-50 transition-all duration-500 animate-in fade-in slide-in-from-right-2">
              <header className="bg-white border-b border-slate-100 px-4 py-2.5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-full bg-[#800000] text-white flex items-center justify-center font-black text-[10px] overflow-hidden">
                    {activeConversation?.otherUser?.avatar_url ? (
                      <img src={activeConversation.otherUser.avatar_url} className="h-full w-full object-cover" />
                    ) : activeConversation?.otherUser?.full_name?.[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] font-black text-slate-900 truncate">{activeConversation?.otherUser?.full_name}</p>
                    <div className="flex items-center gap-1">
                      <span className="h-1 w-1 rounded-full bg-emerald-500" />
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Online</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  {/* Minimize Button (Back to List) */}
                  <button 
                    onClick={() => setActiveConversationId(null)} 
                    className="p-1.5 text-slate-400 hover:text-[#800000] hover:bg-slate-50 rounded-lg transition-all"
                    title="Minimize Thread"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button onClick={() => navigate("/chat")} className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all" title="Full Page">
                    <ExternalLink size={16} />
                  </button>
                  <button onClick={() => setIsOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all">
                    <X size={18} />
                  </button>
                </div>
              </header>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                {isLoadingMessages ? (
                  <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-slate-200" /></div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col h-full items-center justify-center text-center p-6 opacity-30">
                    <MessageSquare size={32} className="mb-2" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Start a conversation</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMine = msg.sender_id === currentUser.id;
                    const prevMsg = messages[idx - 1];
                    const isSameSender = prevMsg?.sender_id === msg.sender_id;
                    
                    return (
                      <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"} ${isSameSender ? "-mt-2" : "mt-1.5"}`}>
                        <div className={`max-w-[80%] px-3 py-2 rounded-[16px] text-[12px] font-medium shadow-sm ring-1 ${
                          isMine 
                            ? "bg-[#800000] text-white ring-red-900/5 rounded-tr-none" 
                            : "bg-white text-slate-800 ring-slate-100 rounded-tl-none"
                        }`}>
                          {msg.body}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-100 flex items-center gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Message..."
                  className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-2 text-[12px] font-medium focus:ring-2 focus:ring-[#800000]/10 transition-all"
                />
                <button type="submit" className="h-9 w-9 flex items-center justify-center bg-[#800000] text-white rounded-xl shadow-lg shadow-red-900/10 hover:scale-105 active:scale-95 transition-all">
                  <Send size={14} />
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="mb-6 h-16 w-16 bg-[#800000] text-white rounded-[24px] shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 group pointer-events-auto relative"
          aria-label="Open Chat"
        >
          <MessageSquare size={28} />
          {totalUnread > 0 && (
            <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-900 text-[11px] font-black h-6 w-6 rounded-xl flex items-center justify-center shadow-lg ring-4 ring-slate-50">
              {totalUnread}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
