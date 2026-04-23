import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

function sortByCreatedAt(items) {
  return [...items].sort(
    (left, right) =>
      new Date(left.created_at).getTime() -
      new Date(right.created_at).getTime(),
  );
}

function mergeMessageList(previous, incoming) {
  const existingById = incoming.id
    ? previous.find((item) => item.id === incoming.id)
    : null;

  if (existingById) {
    return sortByCreatedAt(
      previous.map((item) =>
        item.id === incoming.id ? { ...item, ...incoming } : item,
      ),
    );
  }

  const existingByClientId = incoming.client_message_id
    ? previous.find(
        (item) => item.client_message_id === incoming.client_message_id,
      )
    : null;

  if (existingByClientId) {
    return sortByCreatedAt(
      previous.map((item) =>
        item.client_message_id === incoming.client_message_id
          ? { ...item, ...incoming }
          : item,
      ),
    );
  }

  return sortByCreatedAt([...previous, incoming]);
}

export function useDmMessages(conversationId, socket) {
  const [messages, setMessages] = useState([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messagesError, setMessagesError] = useState("");
  const [reactions, setReactions] = useState([]);

  const messageIds = useMemo(() => {
    return messages
      .map((m) => m.id)
      .filter(Boolean)
      .map(String);
  }, [messages]);

  const loadMessages = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      setIsLoadingMessages(false);
      return;
    }

    setIsLoadingMessages(true);
    setMessagesError("");

    try {
      const { data, error } = await supabase
        .from("dm_messages")
        .select(
          "id, conversation_id, sender_id, recipient_id, body, client_message_id, created_at, deleted_at",
        )
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .limit(150);

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error loading messages:", error);
      setMessagesError(error.message || "Failed to load messages");
    } finally {
      setIsLoadingMessages(false);
    }
  }, [conversationId]);

  const loadReactions = useCallback(async () => {
    if (!messageIds.length) {
      setReactions([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("dm_message_reactions")
        .select("id, message_id, user_id, emoji, created_at")
        .in("message_id", messageIds);

      if (!error) setReactions(data || []);
    } catch (err) {
      console.error("Error loading reactions:", err);
    }
  }, [messageIds]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    loadReactions();
  }, [loadReactions]);

  useEffect(() => {
    if (!conversationId) return undefined;

    const instanceId = Math.random().toString(36).slice(2, 8);
    const channel = supabase
      .channel(`dm-reactions-${conversationId}-${instanceId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "dm_message_reactions" },
        () => {
          loadReactions();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, loadReactions]);

  useEffect(() => {
    if (!conversationId || !socket) return undefined;

    socket.emit("conversation:join", { conversationId }, () => {});

    const onMessageReceived = (payload) => {
      if (payload?.conversationId !== conversationId || !payload?.message) {
        return;
      }
      setMessages((previous) => mergeMessageList(previous, payload.message));
    };

    socket.on("message:new", onMessageReceived);

    return () => {
      socket.emit("conversation:leave", { conversationId }, () => {});
      socket.off("message:new", onMessageReceived);
    };
  }, [conversationId, socket]);

  const appendOptimisticMessage = useCallback((message) => {
    setMessages((previous) => mergeMessageList(previous, message));
  }, []);

  const replaceOptimisticMessage = useCallback((clientMessageId, message) => {
    setMessages((previous) =>
      sortByCreatedAt(
        previous.map((item) =>
          item.client_message_id === clientMessageId
            ? { ...item, ...message }
            : item,
        ),
      ),
    );
  }, []);

  const removeOptimisticMessage = useCallback((clientMessageId) => {
    setMessages((previous) =>
      previous.filter((item) => item.client_message_id !== clientMessageId),
    );
  }, []);

  const deleteMessage = useCallback(async (messageId) => {
    if (!messageId) return;
    const { error } = await supabase
      .from("dm_messages")
      .update({
        deleted_at: new Date().toISOString(),
        body: "[deleted]",
      })
      .eq("id", messageId);

    if (error) throw error;

    setMessages((previous) =>
      previous.map((item) =>
        item.id === messageId
          ? { ...item, deleted_at: new Date().toISOString(), body: "[deleted]" }
          : item,
      ),
    );
    setReactions((previous) =>
      previous.filter((reaction) => reaction.message_id !== messageId),
    );
  }, []);

  const toggleReaction = useCallback(async ({ messageId, emoji, currentUserId }) => {
    if (!messageId || !emoji || !currentUserId) return;

    const existing = reactions.find(
      (r) => r.message_id === messageId && r.user_id === currentUserId,
    );

    if (existing?.emoji === emoji) {
      const { error } = await supabase
        .from("dm_message_reactions")
        .delete()
        .eq("message_id", messageId)
        .eq("user_id", currentUserId);
      if (error) throw error;
      setReactions((prev) =>
        prev.filter((r) => !(r.message_id === messageId && r.user_id === currentUserId)),
      );
      return;
    }

    const { data, error } = await supabase
      .from("dm_message_reactions")
      .upsert(
        { message_id: messageId, user_id: currentUserId, emoji },
        { onConflict: "message_id,user_id" },
      )
      .select("id, message_id, user_id, emoji, created_at")
      .single();

    if (error) throw error;

    setReactions((prev) => {
      const filtered = prev.filter(
        (r) => !(r.message_id === messageId && r.user_id === currentUserId),
      );
      return data ? [...filtered, data] : filtered;
    });
  }, [reactions]);

  const reactionsByMessage = useMemo(() => {
    const map = new Map();
    reactions.forEach((reaction) => {
      const messageId = String(reaction.message_id);
      if (!map.has(messageId)) {
        map.set(messageId, []);
      }
      map.get(messageId).push(reaction);
    });
    return map;
  }, [reactions]);

  return {
    messages,
    isLoadingMessages,
    messagesError,
    refreshMessages: loadMessages,
    appendOptimisticMessage,
    replaceOptimisticMessage,
    removeOptimisticMessage,
    hasMessages: messages.length > 0,
    reactionsByMessage,
    toggleReaction,
    deleteMessage,
  };
}
