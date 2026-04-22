import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

/**
 * Tracks unread message counts per conversation for the current user.
 *
 * Returns:
 *  - unreadCounts  — Map<conversationId, number>
 *  - markAsRead    — async (conversationId) => void  — call when a convo is opened
 *  - refreshUnreadCounts — manually re-fetch counts (e.g. after receiving a message)
 */
export function useUnreadCounts(currentUserId) {
  const [unreadCounts, setUnreadCounts] = useState(() => new Map());

  const refresh = useCallback(async () => {
    if (!currentUserId) {
      setUnreadCounts(new Map());
      return;
    }

    const { data, error } = await supabase.rpc("get_unread_counts", {
      p_user_id: currentUserId,
    });

    if (error || !data) return;

    setUnreadCounts(
      new Map(data.map((row) => [row.conversation_id, Number(row.unread_count)])),
    );
  }, [currentUserId]);

  // Upsert a read receipt for the conversation, then clear local badge
  const markAsRead = useCallback(
    async (conversationId) => {
      if (!currentUserId || !conversationId) return;

      // Optimistically clear the badge immediately for snappy UX
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
          last_read_message_id: null,
        },
        { onConflict: "conversation_id,user_id" },
      );
    },
    [currentUserId],
  );

  // Initial load
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Subscribe to new messages so the badge updates in real-time
  useEffect(() => {
    if (!currentUserId) return undefined;

    const channel = supabase
      .channel(`unread-counts-${currentUserId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "dm_messages" },
        (payload) => {
          // Only bump badge if the message is from someone else
          if (payload.new?.sender_id === currentUserId) return;
          refresh();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, refresh]);

  return { unreadCounts, markAsRead, refreshUnreadCounts: refresh };
}
