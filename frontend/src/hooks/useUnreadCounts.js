import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export function useUnreadCounts(currentUserId) {
  const [unreadCounts, setUnreadCounts] = useState(() => new Map());

  const refresh = useCallback(async () => {
    if (!currentUserId) {
      setUnreadCounts(new Map());
      return;
    }

    try {
      const { data: convos } = await supabase
        .from("dm_conversations")
        .select("id")
        .or(`participant_one.eq.${currentUserId},participant_two.eq.${currentUserId}`);

      if (!convos || convos.length === 0) {
        setUnreadCounts(new Map());
        return;
      }

      const convoIds = convos.map(c => c.id);

      const { data: receipts } = await supabase
        .from("dm_read_receipts")
        .select("conversation_id, read_at")
        .eq("user_id", currentUserId)
        .in("conversation_id", convoIds);

      const receiptMap = new Map((receipts || []).map(r => [r.conversation_id, r.read_at]));

      const counts = new Map();
      
      // Fetch counts in parallel for performance
      const countPromises = convoIds.map(async (convoId) => {
        const lastRead = receiptMap.get(convoId);
        let query = supabase
          .from("dm_messages")
          .select("id", { count: "exact", head: true })
          .eq("conversation_id", convoId)
          .neq("sender_id", currentUserId)
          .is("deleted_at", null);

        if (lastRead) {
          query = query.gt("created_at", lastRead);
        }

        const { count } = await query;
        return { convoId, count };
      });

      const results = await Promise.all(countPromises);
      results.forEach(({ convoId, count }) => {
        if (count > 0) counts.set(convoId, count);
      });

      setUnreadCounts(counts);
    } catch (err) {
      console.error("Error in useUnreadCounts refresh:", err);
    }
  }, [currentUserId]);

  const markAsRead = useCallback(
    async (conversationId) => {
      if (!currentUserId || !conversationId) return;

      setUnreadCounts((previous) => {
        if (!previous.has(conversationId)) return previous;
        const next = new Map(previous);
        next.delete(conversationId);
        return next;
      });

      await supabase.from("dm_read_receipts").upsert(
        {
          conversation_id: conversationId,
          user_id: currentUserId,
          read_at: new Date().toISOString(),
        },
        { onConflict: "conversation_id,user_id" }
      );
    },
    [currentUserId]
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!currentUserId) return undefined;

    // Use a unique channel name to avoid collisions between ChatPage and ChatWidget
    const instanceId = Math.random().toString(36).slice(2, 8);
    const channel = supabase
      .channel(`unread-realtime-${currentUserId}-${instanceId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "dm_messages" },
        (payload) => {
          if (payload.new?.sender_id === currentUserId) return;
          refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, refresh]);

  return { unreadCounts, markAsRead, refreshUnreadCounts: refresh };
}
