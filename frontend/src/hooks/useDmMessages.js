import { useCallback, useEffect, useState } from "react";
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
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [messagesError, setMessagesError] = useState("");

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
          "id, conversation_id, sender_id, recipient_id, body, client_message_id, created_at",
        )
        .eq("conversation_id", conversationId)
        .is("deleted_at", null)
        .order("created_at", { ascending: true })
        .limit(150);

      if (error) {
        throw error;
      }

      setMessages(data || []);
    } catch (error) {
      setMessagesError(error.message || "Failed to load messages");
    } finally {
      setIsLoadingMessages(false);
    }
  }, [conversationId]);

  useEffect(() => {
    queueMicrotask(() => {
      loadMessages();
    });
  }, [loadMessages]);

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

  return {
    messages,
    isLoadingMessages,
    messagesError,
    refreshMessages: loadMessages,
    appendOptimisticMessage,
    replaceOptimisticMessage,
    removeOptimisticMessage,
    hasMessages: messages.length > 0,
  };
}
