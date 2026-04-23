import React, { useState, useEffect, useMemo } from 'react';
import { SDGs, CORE_SDGS, getSDGById } from '../../common/SDGConstants';
import { supabase } from '../../lib/supabaseClient';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell
} from 'recharts';
import { 
  ShieldCheck, 
  Users, 
  Target, 
  Award,
  Loader2
} from 'lucide-react';

const SDGImpactDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    distribution: [],
    timeline: [],
    stats: []
  });

  const fetchRealtimeData = async () => {
    setLoading(true);
    try {
      // 1. Fetch all content with SDG tags
      const [proposalsRes, postsRes, announcementsRes] = await Promise.all([
        supabase.from('proposals').select('sdg_tags, created_at, status, author_id'),
        supabase.from('forum_posts').select('sdg_tags, created_at, author_id'),
        supabase.from('announcements').select('sdg_tags, created_at, author_id')
      ]);

      const allItems = [
        ...(proposalsRes.data || []).map(i => ({ ...i, type: 'proposal' })),
        ...(postsRes.data || []).map(i => ({ ...i, type: 'post' })),
        ...(announcementsRes.data || []).map(i => ({ ...i, type: 'announcement' }))
      ];

      // 2. Aggregate Distribution with Normalization
      const distributionMap = {};
      allItems.forEach(item => {
        if (item.sdg_tags && Array.isArray(item.sdg_tags)) {
          item.sdg_tags.forEach(tagId => {
            if (!tagId) return;
            const numberMatch = tagId.toString().match(/\d+/);
            const normalizedId = numberMatch ? numberMatch[0] : null;
            if (normalizedId) {
              distributionMap[normalizedId] = (distributionMap[normalizedId] || 0) + 1;
            }
          });
        }
      });

      const distributionData = Object.entries(distributionMap)
        .map(([tagId, count]) => {
          const sdg = getSDGById(tagId);
          return {
            name: `SDG ${tagId}`,
            tagId,
            count,
            fullName: sdg?.name || 'Unknown'
          };
        })
        .sort((a, b) => parseInt(a.tagId, 10) - parseInt(b.tagId, 10));

      // 3. Aggregate Timeline (Last 6 Months)
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const timelineMap = {};
      allItems.forEach(item => {
        const date = new Date(item.created_at);
        const key = `${months[date.getMonth()]} ${date.getFullYear()}`;
        timelineMap[key] = (timelineMap[key] || 0) + 1;
      });

      const timelineData = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
        timelineData.push({
          month: months[d.getMonth()],
          fullKey: key,
          initiatives: timelineMap[key] || 0
        });
      }

      // 4. Calculate Stats
      const totalGoals = Object.keys(distributionMap).length;
      const goalCoverage = Math.round((totalGoals / 17) * 100);
      
      // Calculate Impact Leaders (Top Contributors)
      const authorMap = {};
      allItems.forEach(item => {
        if (item.author_id && item.sdg_tags?.length > 0) {
          authorMap[item.author_id] = (authorMap[item.author_id] || 0) + item.sdg_tags.length;
        }
      });

      const leaderEntries = Object.entries(authorMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      // Fetch names for leaders
      let impactLeaders = [];
      if (leaderEntries.length > 0) {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, full_name')
          .in('id', leaderEntries.map(l => l[0]));

        impactLeaders = leaderEntries.map(([id, score], i) => {
          const profile = profiles?.find(p => p.id === id);
          return {
            name: profile?.full_name?.split(' ')[0] || `User ${id.slice(0, 4)}`,
            score,
            color: i === 0 ? '#800000' : '#475569'
          };
        });
      }

      const totalTags = allItems.reduce((acc, item) => acc + (item.sdg_tags?.length || 0), 0);
      const intensity = allItems.length > 0 ? (totalTags / allItems.length).toFixed(1) : 0;

      const stats = [
        { label: "Total Initiatives", value: allItems.length, icon: Target, color: "text-blue-600", bg: "bg-blue-50" },
        { label: "Goals Targeted", value: totalGoals, icon: Award, color: "text-emerald-600", bg: "bg-emerald-50" },
        { label: "Impact Intensity", value: `${intensity}x`, icon: Users, color: "text-amber-600", bg: "bg-amber-50" },
        { label: "Goal Coverage", value: `${goalCoverage}%`, icon: ShieldCheck, color: "text-rose-600", bg: "bg-rose-50" },
      ];

      setData({
        distribution: distributionData,
        timeline: timelineData,
        leaders: impactLeaders,
        stats
      });
    } catch (error) {
      console.error("Error fetching SDG impact data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRealtimeData();
  }, []);

  const coreSdgStats = useMemo(() => {
    return CORE_SDGS.map(id => {
      const sdg = getSDGById(id);
      const dist = data.distribution.find(d => d.tagId === id) || { count: 0 };
      return { ...sdg, count: dist.count };
    });
  }, [data.distribution]);

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-[#800000]" />
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Fetching impact metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Impact Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {data.stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="soft-enter p-6 rounded-[24px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className={`w-12 h-12 rounded-2xl ${stat.bg} dark:bg-opacity-10 flex items-center justify-center mb-4`}>
                <Icon className={stat.color} size={24} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{stat.label}</p>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">{stat.value}</h3>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 soft-enter p-8 rounded-[32px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="mb-8">
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Real-time SDG Distribution</h3>
            <p className="text-sm font-medium text-slate-500">Live breakdown of governance initiatives across global goals.</p>
          </div>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.distribution}>
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
                  cursor={{ fill: '#F8FAFC' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                  labelStyle={{ fontWeight: 800 }}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {data.distribution.map((entry, index) => {
                    const sdg = getSDGById(entry.tagId);
                    const hexColor = sdg?.color.match(/#([a-fA-F0-9]{6})/)?.[0] || '#800000';
                    return <Cell key={`cell-${index}`} fill={hexColor} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Core SDGs Highlight */}
        <div className="soft-enter space-y-6">
          <div className="p-8 rounded-[32px] bg-[#800000] text-white shadow-xl shadow-red-900/20">
            <h3 className="text-xl font-black mb-4 uppercase tracking-tight">Core Alignment</h3>
            <p className="text-red-100 text-sm font-medium mb-6">Institutional priority metrics for SDG 4, 16, and 17.</p>
            
            <div className="space-y-4">
              {coreSdgStats.map((sdg) => (
                <div key={sdg.id} className="flex items-center justify-between bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl bg-white text-[#800000]`}>
                      <sdg.icon size={20} strokeWidth={3} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Goal {sdg.number}</p>
                      <p className="text-sm font-black truncate max-w-[120px]">{sdg.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black">{sdg.count}</p>
                    <p className="text-[10px] font-bold opacity-70">Impacts</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Impact Leaders Chart */}
          <div className="p-8 rounded-[32px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6 uppercase tracking-tight">Impact Leaders</h3>
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={data.leaders}>
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 800, fill: '#64748B' }} 
                  />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="score" radius={[0, 8, 8, 0]}>
                    {data.leaders.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SDGImpactDashboard;
