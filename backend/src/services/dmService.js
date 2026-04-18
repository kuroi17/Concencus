import { supabaseAdmin } from "../lib/supabaseAdmin.js";

export async function getConversation(conversationId) {
  const { data, error } = await supabaseAdmin
    .from("dm_conversations")
    .select("id, participant_one, participant_two")
    .eq("id", conversationId)
    .single();

  if (error) {
    throw new Error("Conversation not found");
  }

  return data;
}

export function isConversationParticipant(conversation, userId) {
  return (
    conversation.participant_one === userId ||
    conversation.participant_two === userId
  );
}

export function resolveRecipientId(conversation, senderId) {
  if (conversation.participant_one === senderId) {
    return conversation.participant_two;
  }

  if (conversation.participant_two === senderId) {
    return conversation.participant_one;
  }

  throw new Error("User is not a participant of this conversation");
}

export async function insertMessage({
  conversationId,
  senderId,
  recipientId,
  body,
  clientMessageId,
}) {
  const { data, error } = await supabaseAdmin
    .from("dm_messages")
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      recipient_id: recipientId,
      body,
      client_message_id: clientMessageId || null,
    })
    .select(
      "id, conversation_id, sender_id, recipient_id, body, client_message_id, created_at",
    )
    .single();

  if (error) {
    throw new Error(error.message || "Failed to insert message");
  }

  return data;
}
