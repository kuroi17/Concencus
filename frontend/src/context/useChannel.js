import { useContext } from "react";
import { ChannelContext } from "./channelContextStore";

export function useChannel() {
  const ctx = useContext(ChannelContext);

  if (!ctx) {
    throw new Error("useChannel must be used within a ChannelProvider");
  }

  return ctx;
}
