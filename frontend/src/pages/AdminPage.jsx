import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, ShieldAlert, ShieldCheck, Users, FileText, CheckCircle, Clock, UserCheck, GraduationCap, LayoutDashboard, TrendingUp, BarChart3, MoreVertical, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabaseClient";
import { useCurrentUserProfile } from "../hooks/useCurrentUserProfile";
import MainLayout from "../components/layouts/MainLayout";
import SDGImpactDashboard from "../components/AdminComponents/SDGImpactDashboard";

const roles = ["student", "faculty", "admin"];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] } 
  }
};

function AdminPage() {
  const { profile, isAdmin, isLoadingProfile } = useCurrentUserProfile();
  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [savingIds, setSavingIds] = useState([]);
  const [adminView, setAdminView] = useState("impact"); // Default to impact
  const [proposals, setProposals] = useState([]);
  const [isLoadingProposals, setIsLoadingProposals] = useState(false);

  const stats = useMemo(() => {
    return {
      totalUsers: users.length,
      admins: users.filter(u => u.campus_role === "admin").length,
      faculty: users.filter(u => u.campus_role === "faculty").length,
      students: users.filter(u => u.campus_role === "student").length,
      pendingProposals: proposals.filter(p => p.status === "Pending" || p.status === "Under Review").length,
    };
  }, [users, proposals]);

  const loadProposals = useCallback(async () => {
    if (!isAdmin) return;
    setIsLoadingProposals(true);
    const { data, error } = await supabase
      .from("proposals")
      .select(`
        *,
        author:user_profiles!author_id(full_name),
        channel:channels(name)
      `)
      .order("created_at", { ascending: false });

    if (!error) {
      setProposals(data || []);
    }
    setIsLoadingProposals(false);
  }, [isAdmin]);

  const loadUsers = useCallback(async () => {
    if (!isAdmin) {
      setUsers([]);
      setIsLoadingUsers(false);
      return;
    }

    setIsLoadingUsers(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("user_profiles")
      .select("id, full_name, sr_code, campus_role, block, created_at")
      .order("full_name", { ascending: true });

    if (error) {
      setErrorMessage(error.message || "Failed to load users.");
      setUsers([]);
      setIsLoadingUsers(false);
      return;
    }

    setUsers(data || []);
    setIsLoadingUsers(false);
  }, [isAdmin]);

  useEffect(() => {
    queueMicrotask(() => {
      loadUsers();
      loadProposals();
    });
  }, [loadUsers, loadProposals]);

  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return users;
    return users.filter((user) => {
      const name = (user.full_name || "").toLowerCase();
      const srCode = (user.sr_code || "").toLowerCase();
      const block = (user.block || "").toLowerCase();
      return name.includes(term) || srCode.includes(term) || block.includes(term);
    });
  }, [users, searchTerm]);

  const filteredProposals = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return proposals;
    return proposals.filter((p) => {
      const title = (p.title || "").toLowerCase();
      const author = (p.author?.full_name || "").toLowerCase();
      const channel = (p.channel?.name || "").toLowerCase();
      return title.includes(term) || author.includes(term) || channel.includes(term);
    });
  }, [proposals, searchTerm]);

  const updateUserRole = async (targetUserId, nextRole) => {
    if (!isAdmin || !targetUserId || !nextRole) return;
    if (targetUserId === profile?.id) {
      setErrorMessage("You cannot change your own role from this screen.");
      return;
    }

    setSavingIds((previous) => [...previous, targetUserId]);
    setErrorMessage("");
    setSuccessMessage("");

    const { error } = await supabase
      .from("user_profiles")
      .update({ campus_role: nextRole })
      .eq("id", targetUserId);

    if (error) {
      setErrorMessage(error.message || "Failed to update role.");
      setSavingIds((previous) => previous.filter((id) => id !== targetUserId));
      return;
    }

    setUsers((previous) =>
      previous.map((entry) =>
        entry.id === targetUserId ? { ...entry, campus_role: nextRole } : entry,
      ),
    );
    setSuccessMessage("Role updated successfully.");
    setSavingIds((previous) => previous.filter((id) => id !== targetUserId));
  };

  if (isLoadingProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 dark:border-slate-800 border-t-[#800000]" />
          <p>Syncing admin console...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <MainLayout title="Admin Access">
        <div className="mx-auto flex w-full max-w-[1040px] flex-col gap-6 py-12">
          <section className="rounded-[32px] border border-rose-200 dark:border-rose-900/30 bg-rose-50 dark:bg-rose-950/20 p-8 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400">
              <ShieldAlert size={32} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Access Denied</h2>
            <p className="mt-2 text-slate-600 dark:text-slate-400 font-medium">
              This restricted area is for authorized student governance administrators only.
            </p>
          </section>
        </div>
      </MainLayout>
    );
  }

  const searchSlot = (
    <div className="relative w-full max-w-[400px]">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder={`Search ${adminView === "users" ? "users by name, ID, or block..." : "proposals by title, author..."}`}
        className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 py-3 pl-11 pr-4 text-sm font-bold text-slate-900 dark:text-white outline-none transition-all focus:ring-2 focus:ring-[#800000]/10"
      />
    </div>
  );

  return (
    <MainLayout title="Admin Console" searchSlot={searchSlot}>
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="mx-auto flex w-full max-w-none flex-col gap-8 py-6 px-1 sm:px-2"
      >
        {/* Premium Header */}
        <header className="relative overflow-hidden rounded-[40px] bg-slate-900 px-8 py-12 text-white shadow-2xl dark:shadow-black/40">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#800000]/20 blur-[100px]" />
          <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-blue-500/10 blur-[100px]" />
          
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <motion.div variants={itemVariants} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/70 backdrop-blur-md border border-white/10">
                <ShieldCheck size={14} />
                Governance Administrator
              </motion.div>
              <motion.h1 variants={itemVariants} className="text-4xl font-black tracking-tight sm:text-5xl">
                Administrative Hub
              </motion.h1>
              <motion.p variants={itemVariants} className="max-w-xl text-lg font-medium text-slate-400">
                Manage campus identities, oversee student proposals, and track 
                the real-world impact of governance decisions.
              </motion.p>
            </div>
            
            <motion.div variants={itemVariants} className="flex gap-4">
               <div className="rounded-3xl bg-white/5 p-5 backdrop-blur-xl border border-white/10">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">System Status</p>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                    <span className="text-sm font-bold">All Systems Operational</span>
                  </div>
               </div>
            </motion.div>
          </div>
        </header>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          <StatCard icon={Users} label="Total Users" value={stats.totalUsers} color="slate" trend="+12 this week" />
          <StatCard icon={ShieldCheck} label="Admins" value={stats.admins} color="rose" />
          <StatCard icon={UserCheck} label="Faculty" value={stats.faculty} color="blue" />
          <StatCard icon={GraduationCap} label="Students" value={stats.students} color="emerald" />
          <StatCard icon={FileText} label="Pending" value={stats.pendingProposals} color="amber" isMobileHidden />
        </div>

        {/* Action Header & Tabs */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <motion.div variants={itemVariants} className="relative flex max-w-full items-center gap-2 overflow-x-auto no-scrollbar rounded-[24px] bg-slate-100 dark:bg-slate-900/50 p-1.5 ring-1 ring-slate-200 dark:ring-slate-800">
            {[
              { id: "users", label: "User Roles", icon: Users },
              { id: "proposals", label: "Proposals", icon: FileText },
              { id: "impact", label: "SDG Impact", icon: BarChart3 }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setAdminView(tab.id)}
                className={`relative flex shrink-0 items-center gap-2 rounded-[18px] px-4 py-2.5 text-[11px] sm:px-6 sm:py-3 sm:text-xs font-black uppercase tracking-widest transition-all ${
                  adminView === tab.id ? "text-white" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                {adminView === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 rounded-[18px] bg-[#800000] shadow-lg shadow-red-900/20"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <tab.icon size={16} />
                  {tab.label}
                </span>
              </button>
            ))}
          </motion.div>

          <AnimatePresence mode="wait">
            {(errorMessage || successMessage) && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={`rounded-2xl px-6 py-3 text-[11px] font-black uppercase tracking-widest ${errorMessage ? "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30" : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30"}`}
              >
                {errorMessage || successMessage}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Content Table Area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={adminView}
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={containerVariants}
          >
            {adminView === "impact" ? (
              <SDGImpactDashboard />
            ) : (
              <section className="overflow-hidden rounded-[32px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl shadow-slate-200/40 dark:shadow-black/40">
                {adminView === "users" ? (
                  <>
                    {/* Mobile card view */}
                    <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                      {isLoadingUsers ? (
                        <div className="flex flex-col items-center gap-3 py-16">
                          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 dark:border-slate-800 border-t-[#800000]" />
                          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Syncing records...</p>
                        </div>
                      ) : filteredUsers.length === 0 ? (
                        <div className="flex flex-col items-center gap-4 py-16">
                          <p className="text-sm font-black text-slate-900 dark:text-white uppercase">No users found</p>
                        </div>
                      ) : filteredUsers.map((user) => (
                        <div key={user.id} className="flex items-center gap-3 p-4">
                          <div className="relative shrink-0">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-sm font-black text-white shadow-md">
                              {user.full_name?.[0]}
                            </div>
                            {user.campus_role === "admin" && (
                              <div className="absolute -right-1 -top-1 rounded-full bg-amber-400 p-0.5 text-slate-900 ring-2 ring-white dark:ring-slate-900">
                                <ShieldCheck size={9} />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-black text-slate-900 dark:text-white truncate">
                              {user.full_name}
                              {profile?.id === user.id && <span className="ml-1.5 rounded-full bg-[#800000]/10 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest text-[#800000]">You</span>}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{user.sr_code || "—"} · {user.block || "—"}</p>
                          </div>
                          <select
                            value={user.campus_role}
                            onChange={(e) => updateUserRole(user.id, e.target.value)}
                            disabled={savingIds.includes(user.id) || profile?.id === user.id}
                            className="shrink-0 appearance-none rounded-xl border-none bg-slate-100 dark:bg-slate-800 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 outline-none ring-1 ring-slate-200 dark:ring-slate-700 disabled:opacity-50"
                          >
                            {roles.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                    {/* Desktop table view */}
                    <div className="hidden md:block overflow-x-auto no-scrollbar">
                      <table className="w-full min-w-[700px] text-left">
                        <thead className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                          <tr>
                            <th className="px-5 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 sm:px-7">Identity</th>
                            <th className="px-5 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 sm:px-7">SR Code</th>
                            <th className="px-5 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 sm:px-7">Block</th>
                            <th className="px-5 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 sm:px-7">Governance Role</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {isLoadingUsers ? (
                            <LoadingRows cols={4} />
                          ) : filteredUsers.length === 0 ? (
                            <EmptyRows label="No users matched your search" cols={4} />
                          ) : (
                            filteredUsers.map((user) => (
                              <UserRow key={user.id} user={user} isSelf={profile?.id === user.id} isSaving={savingIds.includes(user.id)} onRoleChange={updateUserRole} />
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Mobile card view */}
                    <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                      {isLoadingProposals ? (
                        <div className="flex flex-col items-center gap-3 py-16">
                          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 dark:border-slate-800 border-t-[#800000]" />
                          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Loading proposals...</p>
                        </div>
                      ) : filteredProposals.length === 0 ? (
                        <div className="flex flex-col items-center gap-4 py-16">
                          <p className="text-sm font-black text-slate-900 dark:text-white uppercase">No proposals found</p>
                        </div>
                      ) : filteredProposals.map((p) => {
                        const statusStyles = {
                          Pending: "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700",
                          Approved: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30",
                          Implemented: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30",
                          Rejected: "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/30",
                        };
                        return (
                          <div key={p.id} className="p-4 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-black text-slate-900 dark:text-white line-clamp-2 flex-1">{p.title}</p>
                              <span className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-widest border ${statusStyles[p.status] || statusStyles.Pending}`}>
                                {p.status === "Pending" || p.status === "Under Review" ? <Clock size={9} /> : p.status === "Rejected" ? <ShieldAlert size={9} /> : <CheckCircle size={9} />}
                                {p.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              <span className="bg-slate-100 dark:bg-slate-800 rounded-lg px-2 py-0.5">{p.channel?.name}</span>
                              <span>·</span>
                              <div className="flex items-center gap-1.5">
                                <div className="h-5 w-5 rounded-full bg-[#800000]/10 flex items-center justify-center text-[9px] font-black text-[#800000]">
                                  {p.author?.full_name?.[0]}
                                </div>
                                {p.author?.full_name}
                              </div>
                              <span>·</span>
                              <span>{new Date(p.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {/* Desktop table view */}
                    <div className="hidden md:block overflow-x-auto no-scrollbar">
                      <table className="w-full min-w-[700px] text-left">
                        <thead className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                          <tr>
                            <th className="px-5 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 sm:px-7">Proposal Title</th>
                            <th className="px-5 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 sm:px-7">Channel</th>
                            <th className="px-5 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 sm:px-7">Author</th>
                            <th className="px-5 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 sm:px-7">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {isLoadingProposals ? (
                            <LoadingRows cols={4} />
                          ) : filteredProposals.length === 0 ? (
                            <EmptyRows label="No proposals found" cols={4} />
                          ) : (
                            filteredProposals.map((p) => (
                              <ProposalRow key={p.id} p={p} />
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </section>
            )}

          </motion.div>
        </AnimatePresence>
      </motion.div>
    </MainLayout>
  );
}

/* ── Sub-components ──────────────────────────────────────────────────────── */

function StatCard(props) {
  const { label, value, color, trend, isMobileHidden } = props;
  const CardIcon = props.icon;
  const colors = {
    slate: "text-slate-600 bg-slate-100 dark:text-slate-400 dark:bg-slate-800",
    rose: "text-rose-600 bg-rose-100 dark:text-rose-400 dark:bg-rose-900/20",
    blue: "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20",
    emerald: "text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/20",
    amber: "text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/20",
  };

  return (
    <motion.div 
      variants={itemVariants}
      whileHover={{ y: -5 }}
      className={`rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 transition-all hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-black/40 ${isMobileHidden ? "hidden lg:block" : ""}`}
    >
      <div className="flex items-start justify-between">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${colors[color]}`}>
          <CardIcon size={24} />
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded-full">
            <TrendingUp size={10} />
            {trend}
          </div>
        )}
      </div>
      <div className="mt-6">
        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">{label}</p>
        <p className="mt-1 text-3xl font-black text-slate-900 dark:text-white">{value}</p>
      </div>
    </motion.div>
  );
}

function UserRow({ user, isSelf, isSaving, onRoleChange }) {
  return (
    <motion.tr 
      variants={itemVariants}
      className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
    >
      <td className="px-5 py-5 sm:px-7">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-slate-900 text-[14px] font-black text-white shadow-lg shadow-slate-900/20">
              {user.full_name?.[0]}
            </div>
            {user.campus_role === "admin" && (
              <div className="absolute -right-1 -top-1 rounded-full bg-amber-400 p-1 text-slate-900 shadow-md ring-2 ring-white dark:ring-slate-900">
                <ShieldCheck size={10} />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black text-slate-900 dark:text-white truncate flex items-center gap-2">
              {user.full_name}
              {isSelf && <span className="rounded-full bg-[#800000]/10 dark:bg-red-500/20 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-[#800000] dark:text-red-400">You</span>}
            </p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Member since {new Date(user.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-5 text-xs font-black text-slate-600 dark:text-slate-400 tabular-nums sm:px-7">{user.sr_code || "—"}</td>
      <td className="px-5 py-5 text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest sm:px-7">{user.block || "—"}</td>
      <td className="px-5 py-5 sm:px-7">
        <div className="flex items-center gap-4">
          <div className="relative">
            <select
              value={user.campus_role}
              onChange={(e) => onRoleChange(user.id, e.target.value)}
              disabled={isSaving || isSelf}
              className="appearance-none rounded-[14px] border-none bg-slate-100 dark:bg-slate-800 pl-4 pr-10 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 outline-none ring-1 ring-slate-200 dark:ring-slate-700 transition-all focus:ring-2 focus:ring-[#800000]/30 disabled:opacity-50 cursor-pointer"
            >
              {roles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <MoreVertical size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
          
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
              <ExternalLink size={14} />
            </button>
          </div>
        </div>
      </td>
    </motion.tr>
  );
}

function ProposalRow({ p }) {
  const statusStyles = {
    Pending: "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700",
    Approved: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30",
    Implemented: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30",
    Rejected: "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/30",
  };

  return (
    <motion.tr 
      variants={itemVariants}
      className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
    >
      <td className="px-5 py-5 sm:px-7">
        <div className="space-y-1">
          <p className="text-sm font-black text-slate-900 dark:text-white line-clamp-1">{p.title}</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider tabular-nums">{new Date(p.created_at).toLocaleDateString()}</p>
        </div>
      </td>
      <td className="px-5 py-5 sm:px-7">
        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
          {p.channel?.name}
        </span>
      </td>
      <td className="px-5 py-5 sm:px-7">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-[#800000]/10 flex items-center justify-center text-[10px] font-black text-[#800000]">
            {p.author?.full_name?.[0]}
          </div>
          <span className="text-xs font-black text-slate-600 dark:text-slate-400">{p.author?.full_name}</span>
        </div>
      </td>
      <td className="px-5 py-5 sm:px-7">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-widest border ${statusStyles[p.status] || (p.status === "Under Review" ? statusStyles.Pending : "")}`}>
          {(p.status === "Pending" || p.status === "Under Review") ? <Clock size={12} /> : p.status === "Rejected" ? <ShieldAlert size={12} /> : <CheckCircle size={12} />}
          {p.status}
        </span>
      </td>
    </motion.tr>
  );
}

function LoadingRows({ cols }) {
  return (
    <motion.tr variants={itemVariants}>
      <td colSpan={cols} className="px-5 py-20 text-center sm:px-7">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 dark:border-slate-800 border-t-[#800000]" />
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Syncing database records...</p>
        </div>
      </td>
    </motion.tr>
  );
}
function EmptyRows({ label, cols }) {
  return (
    <motion.tr variants={itemVariants}>
      <td colSpan={cols} className="px-5 py-24 text-center sm:px-7">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="absolute inset-0 bg-slate-200 dark:bg-slate-800 blur-2xl rounded-full opacity-20" />
            <div className="relative rounded-[24px] bg-slate-50 dark:bg-slate-900/50 p-6 border border-slate-200 dark:border-slate-800">
              <LayoutDashboard size={40} className="text-slate-300 dark:text-slate-600" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{label}</p>
            <p className="text-xs text-slate-500 font-medium">Try adjusting your filters or search term</p>
          </div>
        </div>
      </td>
    </motion.tr>
  );
}

export default AdminPage;
