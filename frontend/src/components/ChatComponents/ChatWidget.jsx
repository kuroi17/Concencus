import { useState, useEffect, useMemo, useRef } from "react";
import { MessageSquare, X, Send, Search, ChevronLeft, Loader2, ExternalLink, AlertCircle } from "lucide-react";
import { useDmConversations } from "../../hooks/useDmConversations";
import { useDmMessages } from "../../hooks/useDmMessages";
import { useUnreadCounts } from "../../hooks/useUnreadCounts";
import { createSocketClient } from "../../lib/socketClient";
import { supabase } from "../../lib/supabaseClient";
import { useNavigate, useLocation } from "react-router-dom";
import { useUser } from "../../context/UserContext";

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default function ChatWidget() {
  const { user: currentUser } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [miniSearchResults, setMiniSearchResults] = useState([]);
  const [socket, setSocket] = useState(null);
  const [messageInput, setMessageInput] = useState("");
  
  const navigate = useNavigate();
  const location = useLocation();
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  const currentUserId = currentUser?.id;

  const {
    conversations = [],
    conversationMap = new Map(),
    refreshConversations,
    createOrGetConversation,
  } = useDmConversations(currentUserId);

  const {
    messages = [],
    isLoadingMessages = false,
    appendOptimisticMessage,
    replaceOptimisticMessage,
    removeOptimisticMessage,
  } = useDmMessages(activeConversationId, socket);

  const { unreadCounts = new Map(), markAsRead, refreshUnreadCounts } = useUnreadCounts(currentUserId);

  const activeConversation = useMemo(() => {
    if (!activeConversationId || !conversationMap) return null;
    return conversationMap.get(activeConversationId) || null;
  }, [conversationMap, activeConversationId]);

  // ── Socket Management ─────────────────────────────────────────
  useEffect(() => {
    if (!currentUserId) return undefined;
    
    let isMounted = true;
    const connect = async () => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (token && isMounted) {
        const client = createSocketClient(token);
        socketRef.current = client;
        setSocket(client);
      }
    };

    connect();

    return () => {
      isMounted = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [currentUserId]);

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // ── User Search ───────────────────────────────────────────────
  useEffect(() => {
    const term = (searchQuery || "").trim();
    
    if (term.length < 2) {
      // Use setTimeout(0) to avoid the "synchronous setState" warning in strict environments
      const clearTimer = setTimeout(() => {
        setMiniSearchResults([]);
      }, 0);
      return () => clearTimeout(clearTimer);
    }

    const timer = setTimeout(async () => {
      if (!currentUserId) return;
      try {
        const { data } = await supabase
          .from("user_profiles")
          .select("id, full_name, sr_code, avatar_url")
          .or(`full_name.ilike.%${term}%,sr_code.ilike.%${term}%`)
          .neq("id", currentUserId)
          .limit(5);
        setMiniSearchResults(data || []);
      } catch (err) {
        console.error("Widget search error:", err);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, currentUserId]);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const content = messageInput.trim();
    if (!content || !activeConversationId || !socket) return;

    const clientId = `mini-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    appendOptimisticMessage({
      id: clientId,
      client_message_id: clientId,
      body: content,
      sender_id: currentUserId,
      conversation_id: activeConversationId,
      created_at: new Date().toISOString(),
    });
    setMessageInput("");

    socket.emit("message:send", { conversationId: activeConversationId, body: content, clientMessageId: clientId }, (res) => {
      if (res?.ok) {
        replaceOptimisticMessage(clientId, res.message);
        if (refreshConversations) refreshConversations({ silent: true });
        if (refreshUnreadCounts) refreshUnreadCounts();
      } else {
        removeOptimisticMessage(clientId);
      }
    });
  };

  const totalUnread = useMemo(() => {
    if (!unreadCounts || typeof unreadCounts.values !== "function") return 0;
    return [...unreadCounts.values()].reduce((a, b) => a + b, 0);
  }, [unreadCounts]);

  if (location.pathname === "/chat" || !currentUser) return null;

  return (
    <div className="fixed bottom-0 right-6 z-[100] flex flex-col items-end gap-0 pointer-events-none">
      {isOpen && (
        <div 
          className={`bg-white dark:bg-slate-900 shadow-[0_-20px_50px_rgba(0,0,0,0.12)] dark:shadow-[0_-20px_50px_rgba(0,0,0,0.5)] rounded-t-[24px] overflow-hidden flex border-x border-t border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out pointer-events-auto h-[480px] ${
            activeConversationId ? "w-[680px]" : "w-[320px]"
          }`}
        >
          {/* Left Pane (Conversations) */}
          <div className={`flex flex-col border-r border-slate-100 dark:border-slate-800 transition-all duration-300 ${activeConversationId ? "w-[240px]" : "w-full"}`}>
            <header className="bg-slate-900 dark:bg-black px-4 py-3 flex items-center justify-between text-white shrink-0">
              <span className="font-black text-[11px] uppercase tracking-widest">Messages</span>
              {!activeConversationId && (
                <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1 rounded-lg">
                  <X size={18} />
                </button>
              )}
            </header>

            <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900">
              <div className="p-3 shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={14} />
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl pl-9 pr-3 py-2 text-[11px] font-bold dark:text-white dark:placeholder-slate-500"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar px-2 pb-4">
                {(searchQuery || "").trim().length >= 2 ? (
                  miniSearchResults.map(p => (
                    <button key={p.id} onClick={async () => {
                      const c = await createOrGetConversation(p.id);
                      if (c) {
                        setActiveConversationId(c.id);
                        setSearchQuery("");
                        if (markAsRead) markAsRead(c.id);
                      }
                    }} className="w-full flex items-center gap-2 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-left">
                      <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full border border-slate-200 dark:border-slate-800">
                        {p.avatar_url ? (
                          <img src={p.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-[#800000]/10 dark:bg-red-500/20 text-[#800000] dark:text-red-400 font-black text-[10px]">
                            {getInitials(p.full_name)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-black truncate dark:text-white">{p.full_name}</p>
                        <p className="text-[9px] text-slate-400 dark:text-slate-500 truncate">{p.sr_code}</p>
                      </div>
                    </button>
                  ))
                ) : (
                  conversations.map(c => {
                    const unread = unreadCounts?.get(c.id) || 0;
                    return (
                      <button 
                        key={c.id} 
                        onClick={() => { 
                          setActiveConversationId(c.id); 
                          if (markAsRead) markAsRead(c.id); 
                        }} 
                        className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left transition-colors ${activeConversationId === c.id ? "bg-slate-50 dark:bg-slate-800" : "hover:bg-slate-50/50 dark:hover:bg-slate-800/50"}`}
                      >
                        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-slate-200 dark:border-slate-800">
                          {c.otherUser?.avatar_url ? (
                            <img src={c.otherUser.avatar_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className={`flex h-full w-full items-center justify-center font-black text-[11px] ${activeConversationId === c.id ? "bg-[#800000] dark:bg-red-900 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"}`}>
                              {getInitials(c.otherUser?.full_name)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <p className="text-[11px] font-black truncate text-slate-900 dark:text-white">{c.otherUser?.full_name}</p>
                            {unread > 0 && <span className="bg-[#800000] dark:bg-red-600 text-white text-[9px] font-black h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center">{unread}</span>}
                          </div>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                            {c.latestMessage?.body || "Start a conversation"}
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Pane (Chat Thread) */}
          {activeConversationId && (
            <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950">
              <header className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full border border-slate-100 dark:border-slate-800">
                    {activeConversation?.otherUser?.avatar_url ? (
                      <img src={activeConversation.otherUser.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-400 dark:text-slate-500">
                        {getInitials(activeConversation?.otherUser?.full_name)}
                      </div>
                    )}
                  </div>
                  <span className="text-[12px] font-black truncate text-slate-900 dark:text-white">{activeConversation?.otherUser?.full_name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setActiveConversationId(null)} className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-[#800000] dark:hover:text-red-400 transition-colors"><ChevronLeft size={16} /></button>
                  <button onClick={() => navigate("/chat")} className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"><ExternalLink size={16} /></button>
                  <button onClick={() => setIsOpen(false)} className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"><X size={18} /></button>
                </div>
              </header>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                {isLoadingMessages ? (
                  <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-slate-200 dark:text-slate-700" /></div>
                ) : (
                  messages.map((m, i) => (
                    <div key={m.id || i} className={`flex ${m.sender_id === currentUserId ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] px-3 py-2 rounded-[16px] text-[12px] leading-relaxed shadow-sm ${m.sender_id === currentUserId ? "bg-[#800000] dark:bg-red-900/80 text-white rounded-br-none" : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-100 dark:border-slate-800"}`}>
                        {m.body}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <input 
                  type="text" 
                  value={messageInput} 
                  onChange={(e) => setMessageInput(e.target.value)} 
                  placeholder="Type a message..." 
                  className="flex-1 bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2.5 text-[12px] font-medium focus:ring-1 focus:ring-[#800000]/20 dark:focus:ring-red-400/20 dark:text-white dark:placeholder-slate-500 transition-all" 
                />
                <button 
                  type="submit" 
                  disabled={!messageInput.trim() || !socket}
                  className="h-10 w-10 bg-[#800000] dark:bg-red-900 text-white rounded-xl flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                >
                  <Send size={14} />
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)} 
          className="mb-6 h-16 w-16 bg-[#800000] text-white rounded-[24px] shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 pointer-events-auto relative group"
        >
          <MessageSquare size={28} className="transition-transform group-hover:rotate-12" />
          {totalUnread > 0 && (
            <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-900 text-[11px] font-black h-6 w-6 rounded-xl flex items-center justify-center shadow-lg ring-4 ring-white animate-bounce-slow">
              {totalUnread}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
