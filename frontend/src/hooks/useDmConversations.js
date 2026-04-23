import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export function useDmConversations(currentUserId) {
  const [conversations, setConversations] = useState([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);

  const loadConversations = useCallback(async (options = { silent: false }) => {
    if (!currentUserId) {
      setConversations([]);
      setIsLoadingConversations(false);
      return;
    }

    if (!options.silent) setIsLoadingConversations(true);

    try {
      const { data: convos, error: convoError } = await supabase
        .from("dm_conversations")
        .select("*")
        .or(`participant_one.eq.${currentUserId},participant_two.eq.${currentUserId}`)
        .order("latest_message_at", { ascending: false });

      if (convoError) throw convoError;
      if (!convos || convos.length === 0) {
        setConversations([]);
        return;
      }

      const otherUserIds = convos.map(c => 
        c.participant_one === currentUserId ? c.participant_two : c.participant_one
      );

      const { data: profiles, error: profileError } = await supabase
        .from("user_profiles")
        .select("id, full_name, avatar_url, campus_role, sr_code")
        .in("id", otherUserIds);

      if (profileError) throw profileError;
      const profileMap = new Map((profiles || []).map(p => [p.id, p]));

      const { data: latestMessages, error: msgError } = await supabase
        .from("dm_messages")
        .select("id, conversation_id, body, created_at")
        .in("conversation_id", convos.map(c => c.id))
        .order("created_at", { ascending: false });

      const msgMap = new Map();
      if (!msgError && latestMessages) {
        latestMessages.forEach(m => {
          if (!msgMap.has(m.conversation_id)) {
            msgMap.set(m.conversation_id, m);
          }
        });
      }

      const enriched = convos.map(c => {
        const otherId = c.participant_one === currentUserId ? c.participant_two : c.participant_one;
        return {
          ...c,
          otherUserId: otherId,
          otherUser: profileMap.get(otherId) || { id: otherId, full_name: "User" },
          latestMessage: msgMap.get(c.id) || null
        };
      });

      setConversations(enriched);
    } catch (err) {
      console.error("Error in loadConversations:", err);
    } finally {
      if (!options.silent) setIsLoadingConversations(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const conversationMap = useMemo(() => {
    return new Map(conversations.map((c) => [c.id, c]));
  }, [conversations]);

  const createOrGetConversation = useCallback(
    async (otherUserId) => {
      if (!currentUserId || !otherUserId) return null;

      try {
        const p1 = currentUserId < otherUserId ? currentUserId : otherUserId;
        const p2 = currentUserId < otherUserId ? otherUserId : currentUserId;

        const { data: existing } = await supabase
          .from("dm_conversations")
          .select("*")
          .eq("participant_one", p1)
          .eq("participant_two", p2)
          .maybeSingle();

        if (existing) return existing;

        const { data: created, error: createError } = await supabase
          .from("dm_conversations")
          .insert({
            participant_one: p1,
            participant_two: p2,
            created_by: currentUserId
          })
          .select()
          .single();

        if (createError) throw createError;

        await loadConversations({ silent: true });
        return created;
      } catch (err) {
        console.error("Failed to create/get conversation:", err);
        return null;
      }
    },
    [currentUserId, loadConversations],
  );

  return {
    conversations,
    conversationMap,
    isLoadingConversations,
    refreshConversations: loadConversations,
    createOrGetConversation,
  };
}
