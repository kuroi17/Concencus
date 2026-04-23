import { LogOut } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

const GUEST_MODE_KEY = "concencus_guest_mode";

function SidebarLogoutAction({ compact = false }) {
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleLogout = async () => {
    if (isSigningOut) return;

    setIsSigningOut(true);

    try {
      await supabase.auth.signOut();
    } finally {
      localStorage.removeItem(GUEST_MODE_KEY);
      setIsSigningOut(false);
      navigate("/auth", { replace: true });
    }
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleLogout}
        className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white"
        aria-label="Log out"
        title={isSigningOut ? "Logging out..." : "Log Out"}
      >
        <LogOut size={15} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="inline-flex w-full items-center justify-center gap-2 rounded-[10px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white"
      aria-label="Log out"
    >
      <LogOut size={15} />
      <span>{isSigningOut ? "Logging out..." : "Log Out"}</span>
    </button>
  );
}

export default SidebarLogoutAction;
