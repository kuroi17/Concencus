function getProposalRoom(proposalId) {
  return `proposal:${proposalId}`;
}

function getChannelRoom(channelId) {
  return `channel:${channelId}`;
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

export function registerProposalSocket(io, socket) {
  // Join a specific channel to receive proposal updates for that channel
  socket.on("proposals:join_channel", (payload, ack) => {
    const channelId = payload?.channelId;
    if (!channelId) return fail(ack, "Missing channelId");
    socket.join(getChannelRoom(channelId));
    success(ack, { channelId });
  });

  // Vote event - broadcast update to everyone in the channel
  socket.on("proposal:vote", (payload) => {
    const { proposalId, channelId, upvotes, downvotes, userId, voteType } = payload;
    if (!proposalId || !channelId) return;

    // Broadcast the new vote counts to all users in the channel
    io.to(getChannelRoom(channelId)).emit("proposal:vote_update", {
      proposalId,
      upvotes,
      downvotes,
      userId,
      voteType
    });
  });

  // Status update - broadcast to everyone in the channel
  socket.on("proposal:status_update", (payload) => {
    const { proposalId, channelId, status } = payload;
    if (!proposalId || !channelId || !status) return;

    io.to(getChannelRoom(channelId)).emit("proposal:status_changed", {
      proposalId,
      status
    });
  });

  // Admin response - broadcast to everyone in the channel
  socket.on("proposal:new_response", (payload) => {
    const { proposalId, channelId, response } = payload;
    if (!proposalId || !channelId || !response) return;

    io.to(getChannelRoom(channelId)).emit("proposal:response_added", {
      proposalId,
      response
    });
  });
}
