import { Users, CircleDot, EyeOff } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";

const rules = [
  "Ensure relevance to the CS curriculum.",
  "Search existing threads before opening new topics.",
  "Maintain professional tone in all replies.",
  "Anonymous posting is allowed; logs remain protected.",
];

function ForumInfoPanel({ onOpenModal }) {
  const [memberCount, setMemberCount] = useState(0);
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const fetchMemberCount = async () => {
      const { count, error } = await supabase
        .from("user_profiles")
        .select("*", { count: "exact", head: true });
      
      if (!error && isMounted && count !== null) {
        setMemberCount(count);
      }
    };

    fetchMemberCount();

    const presenceChannel = supabase.channel("global_forum_presence");

    presenceChannel
      .on("presence", { event: "sync" }, () => {
        if (!isMounted) return;
        const newState = presenceChannel.presenceState();
        
        const uniqueUsers = new Set();
        let connectionCount = 0;

        for (const key in newState) {
          connectionCount++;
          for (const presence of newState[key]) {
            if (presence.user_id) {
              uniqueUsers.add(presence.user_id);
            }
          }
        }

        const activeCount = uniqueUsers.size > 0 ? uniqueUsers.size : connectionCount;
        setOnlineCount(activeCount);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          const { data } = await supabase.auth.getUser();
          await presenceChannel.track({
            user_id: data?.user?.id || "anonymous",
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      isMounted = false;
      supabase.removeChannel(presenceChannel);
    };
  }, []);

  return (
    <aside className="space-y-4" aria-label="Forum details">
      <section className="rounded-[24px] border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <button
          type="button"
          onClick={onOpenModal}
          className="w-full rounded-xl bg-[#800000] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-red-900/20 transition-all hover:-translate-y-0.5 hover:bg-[#a00000] active:translate-y-0"
        >
          Start Discussion
        </button>

        <div className="mt-6 space-y-4">
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">About Channel</h3>
            <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-400">
              Official community for BS Computer Science curriculum concerns, student governance, and academic collaboration.
            </p>
          </div>
          
          <div className="flex flex-col gap-2 rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-4 ring-1 ring-slate-100 dark:ring-slate-800">
            <span className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              <Users size={16} className="text-slate-400 dark:text-slate-500" />
              {memberCount.toLocaleString()} Verified Members
            </span>
            <span className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              <CircleDot size={16} className="text-emerald-500 animate-pulse" />
              {onlineCount.toLocaleString()} Active Now
            </span>
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Institutional Rules</h3>
        <ol className="mt-4 space-y-3">
          {rules.map((rule, idx) => (
            <li key={rule} className="flex gap-3 text-sm font-medium text-slate-600 dark:text-slate-400">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-400 dark:text-slate-500">
                {idx + 1}
              </span>
              {rule}
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-[24px] border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Safe Engagement</h3>
        <div className="mt-4 flex gap-3 rounded-2xl bg-amber-50/50 dark:bg-amber-900/10 p-4 ring-1 ring-amber-100/50 dark:ring-amber-900/20">
          <EyeOff size={20} className="shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-xs font-semibold leading-relaxed text-amber-800 dark:text-amber-300">
            Anonymous posting is supported for sensitive governance feedback. Moderators maintain encrypted logs for safety.
          </p>
        </div>
      </section>
    </aside>
  );
}

export default ForumInfoPanel;
