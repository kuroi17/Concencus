import { io } from "socket.io-client";

const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:3001";

export function createSocketClient(accessToken) {
  return io(socketUrl, {
    transports: ["polling", "websocket"],
    autoConnect: true,
    reconnection: true,
    auth: {
      token: accessToken,
    },
  });
}
