import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { ChannelContext } from "./channelContextStore";

// ─── Fallback while channels are loading from Supabase ───────────────────────
const FALLBACK_CHANNEL = {
  id: null,
  slug: "cics",
  name: "CICS",
  description: "College of Information and Computer Sciences",
  category: "colleges",
};

export function ChannelProvider({ children }) {
  const [categories, setCategories] = useState([]);
  const [currentChannel, setCurrentChannel] = useState(FALLBACK_CHANNEL);
  const [loadingChannels, setLoadingChannels] = useState(true);

  useEffect(() => {
    const fetchChannels = async () => {
      const { data, error } = await supabase
        .from("channels")
        .select("id, slug, name, description, category")
        .order("category")
        .order("name");

      if (error) {
        console.error("Failed to fetch channels:", error);
        setLoadingChannels(false);
        return;
      }

      // Group by category in the correct display order
      const ORDER = ["colleges", "programs", "blocks", "organizations"];
      const grouped = ORDER.map((cat) => ({
        id: cat,
        label: cat.charAt(0).toUpperCase() + cat.slice(1),
        channels: data.filter((ch) => ch.category === cat),
      })).filter((g) => g.channels.length > 0);

      setCategories(grouped);

      // Default to the first channel available
      const first = grouped[0]?.channels[0];
      if (first) setCurrentChannel(first);

      setLoadingChannels(false);
    };

    fetchChannels();
  }, []);

  return (
    <ChannelContext.Provider
      value={{ categories, currentChannel, setCurrentChannel, loadingChannels }}
    >
      {children}
    </ChannelContext.Provider>
  );
}
