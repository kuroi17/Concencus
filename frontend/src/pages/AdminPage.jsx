import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, ShieldAlert, ShieldCheck, Users, FileText, CheckCircle, Clock, UserCheck, GraduationCap, LayoutDashboard } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { useCurrentUserProfile } from "../hooks/useCurrentUserProfile";
import MainLayout from "../components/layouts/MainLayout";
import SDGImpactDashboard from "../components/AdminComponents/SDGImpactDashboard";
import { BarChart3 } from "lucide-react";

const roles = ["student", "faculty", "admin"];

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
      pendingProposals: proposals.filter(p => p.status === "Pending").length,
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
    <MainLayout title="Admin Center" searchSlot={searchSlot}>
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-8 py-6">
        {/* Dashboard Stats */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
          <StatCard icon={Users} label="Total Users" value={stats.totalUsers} color="slate" />
          <StatCard icon={ShieldCheck} label="Admins" value={stats.admins} color="rose" />
          <StatCard icon={UserCheck} label="Faculty" value={stats.faculty} color="blue" />
          <StatCard icon={GraduationCap} label="Students" value={stats.students} color="emerald" />
          <StatCard icon={FileText} label="Pending" value={stats.pendingProposals} color="amber" isMobileHidden />
        </div>

        {/* Action Header */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2 rounded-2xl bg-white dark:bg-slate-900 p-1.5 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
            <button
              onClick={() => setAdminView("users")}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-black uppercase tracking-widest transition-all ${adminView === "users" ? "bg-[#800000] text-white shadow-lg shadow-red-900/20" : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
            >
              <Users size={16} />
              User Roles
            </button>
            <button
              onClick={() => setAdminView("proposals")}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-black uppercase tracking-widest transition-all ${adminView === "proposals" ? "bg-[#800000] text-white shadow-lg shadow-red-900/20" : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
            >
              <FileText size={16} />
              Proposals
            </button>
            <button
              onClick={() => setAdminView("impact")}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-black uppercase tracking-widest transition-all ${adminView === "impact" ? "bg-[#800000] text-white shadow-lg shadow-red-900/20" : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
            >
              <BarChart3 size={16} />
              SDG Impact
            </button>
          </div>

          {(errorMessage || successMessage) && (
            <div className={`rounded-xl px-4 py-2.5 text-[11px] font-black uppercase tracking-widest ${errorMessage ? "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400" : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400"}`}>
              {errorMessage || successMessage}
            </div>
          )}
        </div>

        {/* Content Table Area */}
        {adminView === "impact" ? (
          <SDGImpactDashboard />
        ) : (
          <section className="overflow-hidden rounded-[32px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/40 dark:shadow-black/20">
            <div className="overflow-x-auto no-scrollbar">
              {adminView === "users" ? (
                <table className="w-full text-left">
                  <thead className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <tr>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Identity</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">SR Code</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Block</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Governance Role</th>
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
              ) : (
                <table className="w-full text-left">
                  <thead className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <tr>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Proposal Title</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Channel</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Author</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status</th>
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
              )}
            </div>
          </section>
        )}
      </div>
    </MainLayout>
  );
}

/* ── Sub-components ──────────────────────────────────────────────────────── */

function StatCard(props) {
  const { label, value, color, isMobileHidden } = props;
  const CardIcon = props.icon;
  const colors = {
    slate: "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800",
    rose: "text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/20",
    blue: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20",
    emerald: "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/20",
    amber: "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/20",
  };

  return (
    <div className={`rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 transition-all hover:shadow-md ${isMobileHidden ? "hidden lg:block" : ""}`}>
      <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${colors[color]}`}>
        <CardIcon size={20} />
      </div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

function UserRow({ user, isSelf, isSaving, onRoleChange }) {
  return (
    <tr className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
      <td className="px-8 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-black text-slate-500">
            {user.full_name?.[0]}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {user.full_name}
              {isSelf && <span className="ml-2 rounded-full bg-[#800000]/10 dark:bg-red-500/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-[#800000] dark:text-red-400">You</span>}
            </p>
            <p className="text-[10px] text-slate-400 font-medium">Member since {new Date(user.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </td>
      <td className="px-8 py-4 text-sm font-bold text-slate-600 dark:text-slate-400">{user.sr_code || "—"}</td>
      <td className="px-8 py-4 text-sm font-bold text-slate-600 dark:text-slate-400">{user.block || "—"}</td>
      <td className="px-8 py-4">
        <div className="flex items-center gap-3">
          <select
            value={user.campus_role}
            onChange={(e) => onRoleChange(user.id, e.target.value)}
            disabled={isSaving || isSelf}
            className="rounded-xl border-none bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 outline-none ring-1 ring-slate-200 dark:ring-slate-700 transition-all focus:ring-2 focus:ring-[#800000]/20 disabled:opacity-50"
          >
            {roles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          {user.campus_role === "admin" && <ShieldCheck size={16} className="text-emerald-500" />}
        </div>
      </td>
    </tr>
  );
}

function ProposalRow({ p }) {
  const statusStyles = {
    Pending: "bg-slate-100 dark:bg-slate-800 text-slate-500",
    Approved: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
    Implemented: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400",
  };

  return (
    <tr className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
      <td className="px-8 py-4">
        <p className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{p.title}</p>
        <p className="text-[10px] text-slate-400 font-medium">{new Date(p.created_at).toLocaleDateString()}</p>
      </td>
      <td className="px-8 py-4">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{p.channel?.name}</span>
      </td>
      <td className="px-8 py-4 text-sm font-bold text-slate-600 dark:text-slate-400">{p.author?.full_name}</td>
      <td className="px-8 py-4">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusStyles[p.status] || statusStyles.Pending}`}>
          {p.status === "Pending" ? <Clock size={12} /> : <CheckCircle size={12} />}
          {p.status}
        </span>
      </td>
    </tr>
  );
}

function LoadingRows({ cols }) {
  return (
    <tr>
      <td colSpan={cols} className="px-8 py-20 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 dark:border-slate-800 border-t-[#800000]" />
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Loading records...</p>
        </div>
      </td>
    </tr>
  );
}
function EmptyRows({ label, cols }) {
  return (
    <tr>
      <td colSpan={cols} className="px-8 py-20 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-full bg-slate-50 dark:bg-slate-800/50 p-4">
            <LayoutDashboard size={32} className="text-slate-200 dark:text-slate-700" />
          </div>
          <p className="text-sm font-bold text-slate-400 dark:text-slate-500">{label}</p>
        </div>
      </td>
    </tr>
  );
}

export default AdminPage;
