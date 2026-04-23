// Transparency Hub - Governance Insights v2.1
import { useState, useEffect, useMemo } from "react";
import { 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  BarChart3, 
  PieChart, 
  Target, 
  Zap,
  Activity,
  ArrowUpRight,
  ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  PieChart as RePieChart,
  Pie,
  Cell
} from "recharts";
import { supabase } from "../lib/supabaseClient";
import MainLayout from "../components/layouts/MainLayout";
import { getSDGById } from "../common/SDGConstants";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

function TransparencyPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    underReview: 0,
    approved: 0,
    implemented: 0,
    rejected: 0,
    sdgDistribution: [],
    monthlyActivity: []
  });

  const [isSdgModalOpen, setIsSdgModalOpen] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("proposals")
        .select("status, sdg_tags, created_at");

      if (error) throw error;

      // 1. Calculate Status Stats
      const total = data.length;
      const approved = data.filter(p => p.status === "Approved").length;
      const implemented = data.filter(p => p.status === "Implemented").length;
      const underReview = data.filter(p => p.status === "Pending" || p.status === "Under Review").length;
      const rejected = data.filter(p => p.status === "Rejected").length;

      // 2. Calculate SDG Distribution using the new TEXT[] sdg_tags
      // Initialize with all 17 SDGs so they all exist in the map (even with 0 count)
      const sdgMap = {};
      for (let i = 1; i <= 17; i++) {
        sdgMap[i.toString()] = 0;
      }

      data.forEach(p => {
        if (p.sdg_tags && Array.isArray(p.sdg_tags)) {
          p.sdg_tags.forEach(tagId => {
            if (!tagId) return;
            const numberMatch = tagId.toString().match(/\d+/);
            const normalizedId = numberMatch ? parseInt(numberMatch[0], 10).toString() : null;
            if (normalizedId) {
              sdgMap[normalizedId] = (sdgMap[normalizedId] || 0) + 1;
            }
          });
        }
      });

      const sdgDistribution = Object.entries(sdgMap)
        .map(([id, count]) => {
          const sdg = getSDGById(id);
          
          return {
            id,
            number: sdg?.number || id,
            name: sdg?.name || `SDG ${id}`,
            count,
            hex: sdg?.hex || "#808080",
            icon: sdg?.icon || Target
          };
        })
        .sort((a, b) => {
          // Sort by count first, then by number (to keep it stable)
          if (b.count !== a.count) return b.count - a.count;
          return parseInt(a.number, 10) - parseInt(b.number, 10);
        });

      // 3. Monthly Activity
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const timelineMap = {};
      data.forEach(item => {
        const month = new Date(item.created_at).toLocaleString('default', { month: 'short' });
        timelineMap[month] = (timelineMap[month] || 0) + 1;
      });

      const currentMonthIndex = new Date().getMonth();
      const last6Months = [];
      for (let i = 5; i >= 0; i--) {
        const idx = (currentMonthIndex - i + 12) % 12;
        last6Months.push({
          name: months[idx],
          proposals: timelineMap[months[idx]] || 0
        });
      }

      setStats({
        total,
        approved,
        implemented,
        underReview,
        rejected,
        sdgDistribution,
        monthlyActivity: last6Months
      });
    } catch (err) {
      console.error("Transparency fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const successRate = useMemo(() => {
    if (stats.total === 0) return 0;
    return Math.round(((stats.implemented + stats.approved) / stats.total) * 100);
  }, [stats.implemented, stats.approved, stats.total]);

  const METRICS = [
    { label: "Total Initiatives", value: stats.total, icon: Activity, color: "text-slate-900", bg: "bg-slate-100", trend: "+5% from last month" },
    { label: "Under Review", value: stats.underReview, icon: Clock, color: "text-amber-600", bg: "bg-amber-50", trend: "72h avg. response" },
    { label: "Approved", value: stats.approved, icon: ShieldCheck, color: "text-blue-600", bg: "bg-blue-50", trend: "Awaiting implementation" },
    { label: "Implemented", value: stats.implemented, icon: Zap, color: "text-emerald-600", bg: "bg-emerald-50", trend: "Real-world impact" },
  ];

  const pieData = [
    { name: 'Implemented', value: stats.implemented, color: '#10b981' },
    { name: 'Approved', value: stats.approved, color: '#3b82f6' },
    { name: 'Under Review', value: stats.underReview, color: '#f59e0b' },
    { name: 'Rejected', value: stats.rejected, color: '#ef4444' },
  ].filter(d => d.value > 0);

  return (
    <MainLayout>
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="mx-auto max-w-7xl space-y-12 py-10 px-4"
      >
        {/* Header Section */}
        <header className="space-y-6 text-center">
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 rounded-full bg-[#800000]/10 px-5 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#800000] border border-[#800000]/20">
            <Target size={14} />
            Institutional Accountability
          </motion.div>
          <motion.h1 variants={itemVariants} className="text-5xl font-black tracking-tight text-slate-900 dark:text-white sm:text-7xl">
            Transparency Hub
          </motion.h1>
          <motion.p variants={itemVariants} className="mx-auto max-w-3xl text-lg font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
            Every submission is a step toward a better campus. We track administrative responses 
            in real-time to ensure every student voice results in measurable impact.
          </motion.p>
        </header>

        {/* Top Metric Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {METRICS.map((metric, i) => (
            <motion.div 
              key={metric.label}
              variants={itemVariants}
              whileHover={{ y: -5 }}
              className="relative overflow-hidden rounded-[32px] border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-8 shadow-sm"
            >
              <div className={`mb-4 inline-flex rounded-2xl p-3 ${metric.bg} dark:bg-slate-800 ${metric.color}`}>
                <metric.icon size={24} strokeWidth={2.5} />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{metric.label}</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-black text-slate-900 dark:text-white">{metric.value}</p>
                  <ArrowUpRight size={16} className="text-emerald-500" />
                </div>
                <p className="text-[10px] font-bold text-slate-400">{metric.trend}</p>
              </div>
              <div className="absolute -right-6 -bottom-6 h-32 w-32 rounded-full bg-slate-50/50 dark:bg-slate-800/20" />
            </motion.div>
          ))}
        </div>

        {/* Main Analytics Row */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Velocity Chart */}
          <motion.section 
            variants={itemVariants}
            className="lg:col-span-2 rounded-[40px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 shadow-sm"
          >
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Governance Velocity</h2>
                <p className="text-sm font-medium text-slate-500">Proposal submissions over the last 6 months.</p>
              </div>
              <div className="hidden sm:block rounded-xl bg-slate-50 dark:bg-slate-800 px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-500">
                Live Data
              </div>
            </div>
            
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.monthlyActivity}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#800000" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#800000" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 800, fill: '#64748B' }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 800, fill: '#64748B' }} 
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="proposals" 
                    stroke="#800000" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.section>

          {/* Success Rate Card */}
          <motion.section 
            variants={itemVariants}
            className="rounded-[40px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 flex flex-col items-center justify-center text-center shadow-sm"
          >
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-8 uppercase tracking-tight">Impact Success Rate</h3>
            <div className="relative h-56 w-56">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={pieData}
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </RePieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-black text-slate-900 dark:text-white">{successRate}%</span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Resolution</span>
              </div>
            </div>
            <p className="mt-8 text-xs font-medium text-slate-500 leading-relaxed max-w-[200px]">
              Percentage of proposals that reached <b>Approved</b> or <b>Implemented</b> status.
            </p>
          </motion.section>
        </div>

        {/* SDG Section */}
        <section className="space-y-8">
          <div className="flex items-center justify-between px-2">
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">SDG Global Alignment</h2>
              <p className="text-sm font-medium text-slate-500">How our campus initiatives align with United Nations goals.</p>
            </div>
            <button 
              onClick={() => setIsSdgModalOpen(true)}
              className="group flex items-center gap-2 rounded-2xl bg-white dark:bg-slate-800 px-5 py-2.5 text-sm font-black uppercase tracking-widest text-[#800000] dark:text-red-400 shadow-sm transition-all hover:bg-[#800000] hover:text-white"
            >
              Explore All Goals
              <ArrowUpRight size={16} />
            </button>
          </div>
          
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {stats.sdgDistribution.length > 0 ? (
              stats.sdgDistribution.slice(0, 3).map(sdg => (
                <div 
                  key={sdg.id} 
                  className="flex flex-col gap-6 rounded-[32px] border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-8 shadow-xl backdrop-blur-md overflow-hidden relative"
                >
                  <div className="flex items-start justify-between relative z-10">
                    <div 
                      className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg"
                      style={{ backgroundColor: sdg.hex }}
                    >
                      {sdg.icon ? <sdg.icon size={32} strokeWidth={2.5} /> : <span className="text-2xl font-black">{sdg.number}</span>}
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Goal {sdg.number}</p>
                      <p className="text-4xl font-black text-slate-900 dark:text-white">{sdg.count}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4 relative z-10">
                    <div className="min-h-[3rem]">
                      <h4 className="text-lg font-black text-slate-800 dark:text-slate-100 leading-tight">{sdg.name}</h4>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <span>Campus Impact</span>
                        <span>{stats.total > 0 ? Math.round((sdg.count / stats.total) * 100) : 0}%</span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div 
                          className="h-full transition-all duration-1000 ease-out" 
                          style={{ backgroundColor: sdg.hex, width: `${stats.total > 0 ? (sdg.count / stats.total) * 100 : 0}%` }} 
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Decorative number in background */}
                  <span className="absolute -right-4 -bottom-10 text-[120px] font-black text-slate-100 dark:text-slate-800/20 pointer-events-none select-none z-0">
                    {sdg.number}
                  </span>
                </div>
              ))
            ) : (
              <div className="col-span-full py-24 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[48px] bg-slate-50/30">
                <PieChart className="mx-auto mb-4 text-slate-300 dark:text-slate-700 opacity-50" size={64} />
                <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Synchronizing Data...</p>
              </div>
            )}
          </div>
        </section>

        {/* SDG Modal */}
        <AnimatePresence>
          {isSdgModalOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-md"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-4xl overflow-hidden rounded-[48px] bg-white dark:bg-slate-950 shadow-2xl border border-white/10"
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-10 py-8">
                  <div>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Sustainable Development Alignment</h3>
                    <p className="text-sm font-medium text-slate-500">Comprehensive breakdown of campus governance across 17 goals.</p>
                  </div>
                  <button 
                    onClick={() => setIsSdgModalOpen(false)}
                    className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 transition-all hover:bg-[#800000] hover:text-white"
                  >
                    ✕
                  </button>
                </div>
                <div className="max-h-[60vh] overflow-y-auto p-10 no-scrollbar">
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {stats.sdgDistribution.map(sdg => (
                      <div key={sdg.id} className="group flex flex-col gap-6 rounded-[32px] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-7 shadow-sm transition-all hover:border-[#800000]/30 hover:shadow-xl overflow-hidden">
                        <div className="flex items-start justify-between">
                          <div 
                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg transition-transform group-hover:scale-110"
                            style={{ backgroundColor: sdg.hex }}
                          >
                            {sdg.icon ? <sdg.icon size={24} strokeWidth={2.5} /> : <span className="text-lg font-black">{sdg.number}</span>}
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Goal {sdg.number}</p>
                            <p className="text-2xl font-black text-slate-900 dark:text-white">{sdg.count}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 line-clamp-2 leading-snug h-8">{sdg.name}</p>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div className="h-full transition-all duration-1000" style={{ backgroundColor: sdg.hex, width: `${stats.total > 0 ? (sdg.count / stats.total) * 100 : 0}%` }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </MainLayout>
  );
}

export default TransparencyPage;
