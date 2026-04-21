import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, ShieldAlert, ShieldCheck } from "lucide-react";
import Header from "../common/Header";
import { supabase } from "../lib/supabaseClient";
import { useCurrentUserProfile } from "../hooks/useCurrentUserProfile";

const roles = ["student", "faculty", "admin"];

function AdminPage() {
  const { profile, isAdmin, isLoadingProfile } = useCurrentUserProfile();
  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [savingIds, setSavingIds] = useState([]);

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
    });
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) {
      return users;
    }

    return users.filter((user) => {
      const name = (user.full_name || "").toLowerCase();
      const srCode = (user.sr_code || "").toLowerCase();
      const block = (user.block || "").toLowerCase();

      return (
        name.includes(term) || srCode.includes(term) || block.includes(term)
      );
    });
  }, [users, searchTerm]);

  const updateUserRole = async (targetUserId, nextRole) => {
    if (!isAdmin || !targetUserId || !nextRole) {
      return;
    }

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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#f8f9fb] to-[#f2f4f7] px-4 text-sm font-medium text-slate-600">
        Loading admin workspace...
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f8f9fb] to-[#f2f4f7] p-3 sm:p-4 lg:p-6">
        <div className="mx-auto flex w-full max-w-[1040px] flex-col gap-4">
          <Header title="Admin" />

          <main className="border-t border-slate-200 pt-5" role="main">
            <section className="rounded-[16px] border border-amber-200 bg-amber-50 p-5 text-amber-900">
              <p className="m-0 inline-flex items-center gap-2 text-sm font-semibold">
                <ShieldAlert size={16} />
                Access denied
              </p>
              <p className="m-0 mt-2 text-sm">
                This page is only available to admin accounts.
              </p>
            </section>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8f9fb] to-[#f2f4f7] p-3 sm:p-4 lg:p-6">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-4">
        <Header title="Admin Management" />

        <main className="border-t border-slate-200 pt-5" role="main">
          <section className="space-y-4 rounded-[16px] border border-slate-200 bg-white p-4 shadow-[0_10px_26px_rgba(15,23,42,0.07)] sm:p-5">
            <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="m-0 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                  Access Control
                </p>
                <h2 className="m-0 mt-1 text-xl font-semibold text-slate-900 sm:text-2xl">
                  User Roles
                </h2>
                <p className="m-0 mt-1 text-sm text-slate-600">
                  Promote or demote users without running manual SQL.
                </p>
              </div>

              <label className="relative block w-full sm:max-w-[320px]">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search name, SR code, block"
                  className="w-full rounded-[12px] border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition-colors focus:border-[#7f1d1d]"
                />
              </label>
            </header>

            {errorMessage && (
              <p className="m-0 rounded-[10px] border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
                {errorMessage}
              </p>
            )}

            {successMessage && (
              <p className="m-0 rounded-[10px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                {successMessage}
              </p>
            )}

            <div className="overflow-hidden rounded-[12px] border border-slate-200">
              <div className="max-h-[62vh] overflow-auto">
                <table className="w-full border-collapse text-left">
                  <thead className="bg-slate-100 text-xs uppercase tracking-[0.08em] text-slate-600">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Name</th>
                      <th className="px-3 py-2 font-semibold">SR Code</th>
                      <th className="px-3 py-2 font-semibold">Block</th>
                      <th className="px-3 py-2 font-semibold">Role</th>
                    </tr>
                  </thead>

                  <tbody className="bg-white text-sm">
                    {isLoadingUsers ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-3 py-8 text-center text-slate-500"
                        >
                          Loading users...
                        </td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-3 py-8 text-center text-slate-500"
                        >
                          No users found.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((entry) => {
                        const isSaving = savingIds.includes(entry.id);
                        const isSelf = profile?.id === entry.id;

                        return (
                          <tr
                            key={entry.id}
                            className="border-t border-slate-200"
                          >
                            <td className="px-3 py-2 font-medium text-slate-900">
                              {entry.full_name || "Unnamed User"}
                              {isSelf && (
                                <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                                  You
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-slate-700">
                              {entry.sr_code || "—"}
                            </td>
                            <td className="px-3 py-2 text-slate-700">
                              {entry.block || "—"}
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-2">
                                <select
                                  value={entry.campus_role || "student"}
                                  onChange={(event) =>
                                    updateUserRole(entry.id, event.target.value)
                                  }
                                  disabled={isSaving || isSelf}
                                  className="rounded-[10px] border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-700 outline-none transition-colors focus:border-[#7f1d1d] disabled:cursor-not-allowed disabled:bg-slate-100"
                                >
                                  {roles.map((role) => (
                                    <option key={role} value={role}>
                                      {role}
                                    </option>
                                  ))}
                                </select>

                                {entry.campus_role === "admin" && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.07em] text-emerald-700">
                                    <ShieldCheck size={12} />
                                    Admin
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default AdminPage;
