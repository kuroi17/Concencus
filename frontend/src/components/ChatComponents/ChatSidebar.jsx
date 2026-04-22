import { ChevronUp, LogOut, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";

const GUEST_MODE_KEY = "concencus_guest_mode";

function getInitials(fullName) {
  if (!fullName) return "?";

  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function ChatSidebar({ currentUser }) {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isMenuOpen) return undefined;

    const handleOutsideClick = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isMenuOpen]);

  const handleViewProfile = () => {
    setIsMenuOpen(false);
    navigate("/profile");
  };

  const handleLogout = async () => {
    if (isSigningOut) return;

    setIsSigningOut(true);

    try {
      await supabase.auth.signOut();
    } finally {
      localStorage.removeItem(GUEST_MODE_KEY);
      setIsSigningOut(false);
      setIsMenuOpen(false);
      navigate("/auth", { replace: true });
    }
  };

  return (
    <aside
      className="flex flex-col border-b border-slate-200 px-[14px] py-4 sm:px-[18px] lg:min-h-[calc(100vh-3rem)] lg:border-b-0 lg:border-r"
      aria-label="Chat sidebar"
    >
      <div className="border-b border-slate-200 pb-4">
        <h2 className="m-0 text-[1.65rem] font-extrabold leading-tight text-slate-900">
          Direct Messages
        </h2>
        <p className="m-0 mt-0.5 text-xs uppercase tracking-[0.09em] text-slate-500">
          Governance Correspondence
        </p>
      </div>

      {/* spacer — search + conversation list now lives in the center panel */}
      <div className="flex-1" />

      <div
        ref={menuRef}
        className="relative mt-6 border-t border-slate-200 pt-4 lg:mt-auto"
      >
        {isMenuOpen && (
          <div className="absolute bottom-[calc(100%+10px)] left-0 right-0 z-20 overflow-hidden rounded-[14px] border border-slate-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.14)]">
            <button
              type="button"
              onClick={handleViewProfile}
              className="flex w-full items-center gap-2 border-b border-slate-200 px-3 py-2 text-left text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
            >
              <UserRound size={15} />
              View Profile
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
            >
              <LogOut size={15} />
              {isSigningOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsMenuOpen((previous) => !previous)}
          className="flex w-full items-center gap-2 rounded-[12px] border border-slate-200 bg-white px-2.5 py-2 transition-colors hover:bg-slate-50"
        >
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-sm font-semibold text-white">
            {getInitials(currentUser?.full_name)}
          </span>

          <span className="min-w-0 flex-1 text-left">
            <span className="block truncate text-sm font-semibold text-slate-900">
              {currentUser?.full_name || "Authenticated User"}
            </span>
            <span className="block truncate text-xs text-slate-600">
              {currentUser?.sr_code || "No SR Code"}
            </span>
          </span>

          <ChevronUp
            size={16}
            className={`text-slate-500 transition-transform ${
              isMenuOpen ? "rotate-0" : "rotate-180"
            }`}
          />
        </button>
      </div>
    </aside>
  );
}

export default ChatSidebar;
