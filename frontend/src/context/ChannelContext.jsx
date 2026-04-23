import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { ChannelContext } from "./channelContextStore";

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

  const fetchChannels = useCallback(async () => {
    const [{ data: cats, error: catError }, { data: channels, error: chError }] =
      await Promise.all([
        supabase
          .from("channel_categories")
          .select("id, label, sort_order")
          .order("sort_order"),
        supabase
          .from("channels")
          .select("id, slug, name, description, category")
          .order("name"),
      ]);

    if (catError || chError) {
      console.error(catError || chError);
      setLoadingChannels(false);
      return;
    }

    const grouped = (cats || [])
      .map((cat) => ({
        id: cat.id,
        label: cat.label,
        channels: (channels || []).filter((ch) => ch.category === cat.id),
      }))
      .filter((g) => g.channels.length > 0);

    setCategories(grouped);
    const first = grouped[0]?.channels[0];
    if (first) setCurrentChannel((prev) => (prev.id ? prev : first));
    setLoadingChannels(false);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  // Realtime — re-fetches on any change to either table
  // Make sure both tables are added to supabase_realtime publication:
  //   ALTER PUBLICATION supabase_realtime ADD TABLE public.channels;
  //   ALTER PUBLICATION supabase_realtime ADD TABLE public.channel_categories;
  useEffect(() => {
    const sub = supabase
      .channel("channels-provider-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "channels" }, fetchChannels)
      .on("postgres_changes", { event: "*", schema: "public", table: "channel_categories" }, fetchChannels)
      .subscribe();

    return () => supabase.removeChannel(sub);
  }, [fetchChannels]);

  // ── Channel CRUD ──────────────────────────────────────────────
  // No manual fetchChannels() calls — realtime handles the refresh

  const createChannel = useCallback(async ({ name, slug, description, category }) => {
    const { error } = await supabase
      .from("channels")
      .insert({ name, slug, description, category });
    if (error) throw error;
  }, []);

  const updateChannel = useCallback(async (id, { name, slug, description }) => {
    const { error } = await supabase
      .from("channels")
      .update({ name, slug, description })
      .eq("id", id);
    if (error) throw error;
  }, []);

  const deleteChannel = useCallback(async (id) => {
    const { error } = await supabase.from("channels").delete().eq("id", id);
    if (error) throw error;
    // Reset current channel immediately — no need to wait for realtime
    setCurrentChannel((prev) => (prev?.id === id ? FALLBACK_CHANNEL : prev));
  }, []);

  // ── Category CRUD ─────────────────────────────────────────────

  const createCategory = useCallback(async ({ id, label, sort_order }) => {
    const { error } = await supabase
      .from("channel_categories")
      .insert({ id, label, sort_order });
    if (error) throw error;
  }, []);

  const updateCategory = useCallback(async (id, { label, sort_order }) => {
    const { error } = await supabase
      .from("channel_categories")
      .update({ label, sort_order })
      .eq("id", id);
    if (error) throw error;
  }, []);

  const deleteCategory = useCallback(async (id) => {
    const { error } = await supabase
      .from("channel_categories")
      .delete()
      .eq("id", id);
    if (error) throw error;
  }, []);

  return (
    <ChannelContext.Provider
      value={{
        categories,
        currentChannel,
        setCurrentChannel,
        loadingChannels,
        createChannel,
        updateChannel,
        deleteChannel,
        createCategory,
        updateCategory,
        deleteCategory,
      }}
    >
      {children}
    </ChannelContext.Provider>
  );
}