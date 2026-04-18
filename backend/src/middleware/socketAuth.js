import { supabaseAdmin } from "../lib/supabaseAdmin.js";

function extractToken(socket) {
  const headerToken = socket.handshake.headers?.authorization;
  const authToken = socket.handshake.auth?.token;

  if (authToken && typeof authToken === "string") {
    return authToken;
  }

  if (headerToken && typeof headerToken === "string") {
    return headerToken.startsWith("Bearer ")
      ? headerToken.slice(7)
      : headerToken;
  }

  return null;
}

export async function socketAuth(socket, next) {
  try {
    const token = extractToken(socket);

    if (!token) {
      next(new Error("Unauthorized: missing token"));
      return;
    }

    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data?.user) {
      next(new Error("Unauthorized: invalid token"));
      return;
    }

    socket.user = data.user;
    next();
  } catch (_error) {
    next(new Error("Unauthorized: authentication failed"));
  }
}
