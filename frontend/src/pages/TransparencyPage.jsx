import { useState, useEffect } from "react";
import { TrendingUp, CheckCircle, Clock, AlertCircle, BarChart3, PieChart } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import MainLayout from "../components/layouts/MainLayout";

function TransparencyPage() {
  const [stats, setStats] = useState({
    total: 0,
    reviewed: 0,
    approved: 0,
    implemented: 0,
    rejected: 0,
    sdgDistribution: [],
  });

  const getSDGColor = (id) => {
    const colors = {
      1: "bg-red-600", 2: "bg-orange-500", 3: "bg-emerald-500", 4: "bg-red-700",
      5: "bg-orange-600", 6: "bg-sky-400", 7: "bg-yellow-400", 8: "bg-red-900",
      9: "bg-orange-700", 10: "bg-pink-600", 11: "bg-orange-400", 12: "bg-amber-600",
      13: "bg-emerald-700", 14: "bg-blue-600", 15: "bg-lime-500", 16: "bg-blue-800", 17: "bg-blue-900"
    };
    return colors[id] || "bg-slate-400";
  };

  useEffect(() => {
    const fetchStats = async () => {
      const { data, error } = await supabase
        .from("proposals")
        .select("status, sdg_tag");

      if (error || !data) {
        console.error("Error fetching stats:", error);
        return;
      }

      // Calculate SDG distribution
      const sdgMap = {};
      data.forEach(p => {
        if (p.sdg_tag && p.sdg_tag !== "None") {
          sdgMap[p.sdg_tag] = (sdgMap[p.sdg_tag] || 0) + 1;
        }
      });

      const sdgDistribution = Object.entries(sdgMap)
        .map(([name, count]) => ({
          id: parseInt(name.split(":")[0].replace("SDG ", "")),
          name: name.split(": ")[1],
          count,
          color: getSDGColor(parseInt(name.split(":")[0].replace("SDG ", "")))
        }))
        .sort((a, b) => b.count - a.count);

      setStats({
        total: data.length,
        reviewed: data.filter(p => p.status !== "Under Review").length,
        approved: data.filter(p => p.status === "Approved").length,
        implemented: data.filter(p => p.status === "Implemented").length,
        rejected: data.filter(p => p.status === "Rejected").length,
        sdgDistribution,
      });
    };

    fetchStats();
  }, []);

  const [isSdgModalOpen, setIsSdgModalOpen] = useState(false);

  const METRICS = [
    { label: "Total Proposals", value: stats.total, icon: TrendingUp, color: "text-slate-900", bg: "bg-slate-100" },
    { label: "Under Review", value: stats.total - stats.reviewed, icon: Clock, color: "text-amber-600", bg: "bg-amber-100" },
    { label: "Approved", value: stats.approved, icon: CheckCircle, color: "text-blue-600", bg: "bg-blue-100" },
    { label: "Implemented", value: stats.implemented, icon: BarChart3, color: "text-emerald-600", bg: "bg-emerald-100" },
  ];

  return (
    <MainLayout>
      <div className="mx-auto max-w-5xl space-y-12 py-8">
        <header className="space-y-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-red-50 dark:bg-red-900/10 px-4 py-1 text-xs font-black uppercase tracking-widest text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/20">
            Institutional Accountability
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl">
            Transparency Dashboard
          </h1>
          <p className="mx-auto max-w-2xl text-lg font-medium text-slate-500 dark:text-slate-400">
            Real-time tracking of student proposals and administrative action. We turn feedback into governance.
          </p>
        </header>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {METRICS.map((metric) => {
            const Icon = metric.icon;
            return (
              <div key={metric.label} className="relative overflow-hidden rounded-[32px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm transition-all hover:shadow-md">
                <div className={`mb-4 inline-flex rounded-2xl p-3 ${metric.bg} dark:bg-slate-800 ${metric.color}`}>
                  <Icon size={24} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400">{metric.label}</p>
                  <p className="text-4xl font-black text-slate-900 dark:text-white">{metric.value}</p>
                </div>
                <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-slate-50/50 dark:bg-slate-800/50" />
              </div>
            );
          })}
        </div>

        <section className="rounded-[40px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 sm:p-12 shadow-sm">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-md space-y-4">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white leading-tight">Institutional Response Velocity</h2>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                Our commitment is to review every proposal within 72 hours. This chart shows the conversion rate from submission to implementation.
              </p>
              <div className="flex gap-4 pt-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Implemented</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-blue-500" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Approved</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-slate-200 dark:bg-slate-700" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Pending</span>
                </div>
              </div>
            </div>

            <div className="flex flex-1 justify-center lg:justify-end">
              <div className="relative h-64 w-64">
                {/* Simple CSS-based progress circle / mock chart */}
                <div className="absolute inset-0 rounded-full border-[16px] border-slate-100" />
                <div 
                  className="absolute inset-0 rounded-full border-[16px] border-emerald-500" 
                  style={{ 
                    clipPath: `polygon(50% 50%, 50% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, 50% 0%)`, 
                    transform: `rotate(${stats.total > 0 ? (stats.implemented / stats.total) * 360 : 0}deg)` 
                  }}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-4xl font-black text-slate-900">
                    {stats.total > 0 ? Math.round((stats.implemented / stats.total) * 100) : 0}%
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Success Rate</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">SDG Alignment</h2>
            <button 
              onClick={() => setIsSdgModalOpen(true)}
              className="text-sm font-bold text-red-600 dark:text-red-400 hover:underline"
            >
              View All SDGs
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stats.sdgDistribution.length > 0 ? (
              stats.sdgDistribution.slice(0, 3).map(sdg => (
                <div key={sdg.id} className="flex items-center gap-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white font-black ${sdg.color}`}>
                    {sdg.id}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate">{sdg.name}</p>
                    <div className="mt-1 h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className={`h-full ${sdg.color}`} style={{ width: `${(sdg.count / stats.total) * 100}%` }} />
                    </div>
                  </div>
                  <span className="text-sm font-black text-slate-900 dark:text-white">{sdg.count}</span>
                </div>
              ))
            ) : (
              <div className="col-span-full py-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[32px]">
                <PieChart className="mx-auto mb-3 text-slate-300 dark:text-slate-700" size={32} />
                <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">No SDG data captured yet</p>
              </div>
            )}
          </div>
        </section>

        {/* SDG Modal */}
        {isSdgModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-4xl overflow-hidden rounded-[40px] bg-white dark:bg-slate-900 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-8 py-6">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Sustainable Development Goals</h3>
                <button 
                  onClick={() => setIsSdgModalOpen(false)}
                  className="rounded-xl bg-slate-100 dark:bg-slate-800 p-2 text-slate-500 dark:text-slate-400 transition-colors hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white"
                >
                  ✕
                </button>
              </div>
              <div className="max-h-[70vh] overflow-y-auto p-8">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {stats.sdgDistribution.map(sdg => (
                    <div key={sdg.id} className="flex items-center gap-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm transition-all hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-md">
                      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white font-black ${sdg.color}`}>
                        {sdg.id}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate">{sdg.name}</p>
                        <div className="mt-1 h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div className={`h-full ${sdg.color}`} style={{ width: `${(sdg.count / stats.total) * 100}%` }} />
                        </div>
                      </div>
                      <span className="text-sm font-black text-slate-900 dark:text-white">{sdg.count}</span>
                    </div>
                  ))}
                  {stats.sdgDistribution.length === 0 && (
                    <div className="col-span-full py-12 text-center">
                      <p className="font-bold text-slate-400 dark:text-slate-500">No proposals have been tagged with SDGs yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default TransparencyPage;
