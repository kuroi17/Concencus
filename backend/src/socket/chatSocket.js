import {
  getConversation,
  insertMessage,
  isConversationParticipant,
  resolveRecipientId,
} from "../services/dmService.js";

const MAX_MESSAGE_LENGTH = 4000;

function getConversationRoom(conversationId) {
  return `conversation:${conversationId}`;
}

function fail(ack, message) {
  if (typeof ack === "function") {
    ack({ ok: false, error: message });
  }
}

function success(ack, payload) {
  if (typeof ack === "function") {
    ack({ ok: true, ...payload });
  }
}

export function registerChatSocket(io, socket) {
  socket.on("conversation:join", async (payload, ack) => {
    try {
      const conversationId = payload?.conversationId;

      if (!conversationId) {
        fail(ack, "Missing conversationId");
        return;
      }

      const conversation = await getConversation(conversationId);

      if (!isConversationParticipant(conversation, socket.user.id)) {
        fail(ack, "Access denied for this conversation");
        return;
      }

      socket.join(getConversationRoom(conversationId));
      success(ack, { conversationId });
    } catch (error) {
      fail(ack, error.message || "Failed to join conversation");
    }
  });

  socket.on("conversation:leave", (payload, ack) => {
    const conversationId = payload?.conversationId;

    if (!conversationId) {
      fail(ack, "Missing conversationId");
      return;
    }

    socket.leave(getConversationRoom(conversationId));
    success(ack, { conversationId });
  });

  socket.on("message:send", async (payload, ack) => {
    try {
      const conversationId = payload?.conversationId;
      const body = (payload?.body || "").trim();
      const clientMessageId = payload?.clientMessageId || null;

      if (!conversationId) {
        fail(ack, "Missing conversationId");
        return;
      }

      if (!body || body.length > MAX_MESSAGE_LENGTH) {
        fail(ack, "Invalid message body");
        return;
      }

      const conversation = await getConversation(conversationId);

      if (!isConversationParticipant(conversation, socket.user.id)) {
        fail(ack, "Access denied for this conversation");
        return;
      }

      const recipientId = resolveRecipientId(conversation, socket.user.id);

      const message = await insertMessage({
        conversationId,
        senderId: socket.user.id,
        recipientId,
        body,
        clientMessageId,
      });

      io.to(getConversationRoom(conversationId)).emit("message:new", {
        conversationId,
        message,
      });

      success(ack, { message });
    } catch (error) {
      fail(ack, error.message || "Failed to send message");
    }
  });
}
