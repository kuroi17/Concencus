import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

function normalizeConversationPair(userA, userB) {
  return userA.localeCompare(userB) <= 0 ? [userA, userB] : [userB, userA];
}

export function useDmConversations(currentUserId) {
  const [conversations, setConversations] = useState([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [conversationsError, setConversationsError] = useState("");

  const loadConversations = useCallback(async () => {
    if (!currentUserId) {
      setConversations([]);
      setIsLoadingConversations(false);
      return;
    }

    setIsLoadingConversations(true);
    setConversationsError("");

    try {
      const { data: conversationRows, error: conversationsQueryError } =
        await supabase
          .from("dm_conversations")
          .select(
            "id, participant_one, participant_two, latest_message_at, created_at",
          )
          .or(
            `participant_one.eq.${currentUserId},participant_two.eq.${currentUserId}`,
          )
          .order("latest_message_at", { ascending: false, nullsFirst: false });

      if (conversationsQueryError) {
        throw conversationsQueryError;
      }

      if (!conversationRows?.length) {
        setConversations([]);
        return;
      }

      const counterpartIds = [
        ...new Set(
          conversationRows.map((item) =>
            item.participant_one === currentUserId
              ? item.participant_two
              : item.participant_one,
          ),
        ),
      ];

      const [
        { data: profiles, error: profilesError },
        { data: messageRows, error: messagesError },
      ] = await Promise.all([
        supabase
          .from("user_profiles")
          .select("id, full_name, avatar_url, campus_role, block, sr_code")
          .in("id", counterpartIds),
        supabase
          .from("dm_messages")
          .select("id, conversation_id, body, created_at, sender_id")
          .in(
            "conversation_id",
            conversationRows.map((item) => item.id),
          )
          .order("created_at", { ascending: false }),
      ]);

      if (profilesError) throw profilesError;
      if (messagesError) throw messagesError;

      const profileMap = new Map(
        (profiles || []).map((item) => [item.id, item]),
      );
      const latestMessageMap = new Map();

      (messageRows || []).forEach((item) => {
        if (!latestMessageMap.has(item.conversation_id)) {
          latestMessageMap.set(item.conversation_id, item);
        }
      });

      const mapped = conversationRows
        .map((conversation) => {
          const counterpartId =
            conversation.participant_one === currentUserId
              ? conversation.participant_two
              : conversation.participant_one;

          return {
            ...conversation,
            otherUserId: counterpartId,
            otherUser: profileMap.get(counterpartId) || {
              id: counterpartId,
              full_name: "Unknown User",
              avatar_url: null,
              campus_role: "student",
            },
            latestMessage: latestMessageMap.get(conversation.id) || null,
          };
        })
        .sort((left, right) => {
          const leftDate =
            left.latestMessage?.created_at ||
            left.latest_message_at ||
            left.created_at;
          const rightDate =
            right.latestMessage?.created_at ||
            right.latest_message_at ||
            right.created_at;

          return new Date(rightDate).getTime() - new Date(leftDate).getTime();
        });

      setConversations(mapped);
    } catch (error) {
      setConversationsError(error.message || "Failed to load conversations");
    } finally {
      setIsLoadingConversations(false);
    }
  }, [currentUserId]);

  const createOrGetConversation = useCallback(
    async (targetUserId) => {
      if (!currentUserId) {
        throw new Error("Missing authenticated user");
      }

      if (!targetUserId || targetUserId === currentUserId) {
        throw new Error("Invalid conversation target");
      }

      const [participantOne, participantTwo] = normalizeConversationPair(
        currentUserId,
        targetUserId,
      );

      const { data, error } = await supabase
        .from("dm_conversations")
        .insert({
          participant_one: participantOne,
          participant_two: participantTwo,
          created_by: currentUserId,
        })
        .select(
          "id, participant_one, participant_two, latest_message_at, created_at",
        )
        .single();

      if (!error && data) {
        await loadConversations();
        return data;
      }

      if (error?.code !== "23505") {
        throw new Error(error.message || "Failed to create conversation");
      }

      const { data: existingConversation, error: existingError } =
        await supabase
          .from("dm_conversations")
          .select(
            "id, participant_one, participant_two, latest_message_at, created_at",
          )
          .eq("participant_one", participantOne)
          .eq("participant_two", participantTwo)
          .single();

      if (existingError || !existingConversation) {
        throw new Error(
          existingError?.message || "Failed to load existing conversation",
        );
      }

      await loadConversations();
      return existingConversation;
    },
    [currentUserId, loadConversations],
  );

  useEffect(() => {
    queueMicrotask(() => {
      loadConversations();
    });
  }, [loadConversations]);

  useEffect(() => {
    if (!currentUserId) return undefined;

    const channel = supabase
      .channel(`dm-conversations-${currentUserId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "dm_conversations" },
        () => {
          loadConversations();
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "dm_messages" },
        () => {
          loadConversations();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, loadConversations]);

  const conversationMap = useMemo(() => {
    return new Map(conversations.map((item) => [item.id, item]));
  }, [conversations]);

  return {
    conversations,
    conversationMap,
    isLoadingConversations,
    conversationsError,
    refreshConversations: loadConversations,
    createOrGetConversation,
  };
}
