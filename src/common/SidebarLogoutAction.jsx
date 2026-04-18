import { LogOut } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

const GUEST_MODE_KEY = "concencus_guest_mode";

function SidebarLogoutAction() {
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

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="inline-flex w-full items-center justify-center gap-2 rounded-[10px] border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
      aria-label="Log out"
    >
      <LogOut size={15} />
      <span>{isSigningOut ? "Logging out..." : "Log Out"}</span>
    </button>
  );
}

export default SidebarLogoutAction;
