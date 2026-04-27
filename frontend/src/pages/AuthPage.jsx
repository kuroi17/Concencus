import { useEffect, useState } from "react";
import {
  CircleHelp, LogIn, ShieldCheck, UserPlus,
  UserRound, UserRoundCheck, Sparkles, Users, Bell, Gavel,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import ConcensusLogo from "../components/common/ConcensusLogo";

/* ── Feature bullets shown on the left panel ──────────────────── */
const FEATURES = [
  { icon: Bell,    label: "Announcements",  desc: "Stay updated with campus news" },
  { icon: Gavel,   label: "Proposals",      desc: "Submit ideas, vote on initiatives" },
  { icon: Users,   label: "Forum & Chat",   desc: "Discuss, connect, collaborate" },
  { icon: Sparkles,label: "Transparency",   desc: "Track governance in real-time" },
];

function AuthPage({ onGuestMode }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [isResetRequesting, setIsResetRequesting] = useState(false);

  const isLoginMode    = mode === "login";
  const isSignupMode   = mode === "signup";
  const isRecoveryMode = mode === "recovery";

  useEffect(() => {
    const hashParams   = new URLSearchParams(window.location.hash.slice(1));
    const searchParams = new URLSearchParams(window.location.search);
    if (hashParams.get("type") === "recovery" || searchParams.get("type") === "recovery") {
      queueMicrotask(() => { setMode("recovery"); setFeedback("Set your new password below."); });
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") { setMode("recovery"); setFeedback("Set your new password below."); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback("");
    setIsSubmitting(true);
    try {
      if (isLoginMode) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/announcements", { replace: true });
        return;
      }
      if (isRecoveryMode) {
        if (password.length < 6) throw new Error("Password must be at least 6 characters.");
        if (password !== confirmPassword) throw new Error("Passwords do not match.");
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        await supabase.auth.signOut();
        setPassword(""); setConfirmPassword(""); setMode("login");
        setFeedback("Password updated. You can now sign in.");
        return;
      }
      if (password !== confirmPassword) throw new Error("Passwords do not match.");
      const { data, error } = await supabase.auth.signUp({
        email, password, options: { data: { full_name: fullName } },
      });
      if (error) throw error;
      if (data.session) navigate("/announcements", { replace: true });
      else setFeedback("Account created. Check your email to confirm your account.");
    } catch (err) {
      setFeedback(err.message || "Authentication failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuestMode = () => {
    if (onGuestMode) onGuestMode();
    navigate("/announcements", { replace: true });
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) { setFeedback("Enter your email first so we can send the reset link."); return; }
    setFeedback("");
    setIsResetRequesting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth`,
      });
      if (error) throw error;
      setFeedback("Password reset email sent. Check your inbox.");
    } catch (err) {
      setFeedback(err.message || "Unable to send reset email right now.");
    } finally {
      setIsResetRequesting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setFeedback("");
    setIsGoogleSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/announcements` },
      });
      if (error) throw error;
    } catch (err) {
      setFeedback(err.message || "Google sign-in failed. Please try again.");
      setIsGoogleSubmitting(false);
    }
  };

  const switchMode = (next) => { setMode(next); setFeedback(""); setPassword(""); setConfirmPassword(""); };

  return (
    <div className="flex min-h-screen bg-[#f8f9fb] dark:bg-slate-950">

      {/* ── Left Branding Panel (hidden on mobile) ─────────────── */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[520px] shrink-0 flex-col justify-between relative overflow-hidden bg-gradient-to-br from-[#5a0000] via-[#800000] to-[#a50000] px-12 py-14 text-white">
        {/* Background orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -left-32 h-72 w-72 rounded-full bg-white/5 float-slow" />
          <div className="absolute top-1/2 -right-24 h-96 w-96 rounded-full bg-white/5 float-medium" style={{ animationDelay: "2s" }} />
          <div className="absolute -bottom-20 left-24 h-56 w-56 rounded-full bg-white/5 float-slow" style={{ animationDelay: "1s" }} />
        </div>

        {/* Logo / Wordmark */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/90 ring-1 ring-white/30 overflow-hidden">
              <ConcensusLogo size={32} />
            </div>
            <span className="text-xl font-black tracking-tight">Concensus</span>
          </div>
          <div className="mt-1 ml-[52px] h-0.5 w-12 rounded-full bg-white/30" />
        </div>

        {/* Hero copy */}
        <div className="relative z-10 space-y-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-white/50 mb-3">
              Campus Governance Platform
            </p>
            <h1 className="text-5xl xl:text-6xl font-black leading-[1.05] tracking-tight">
              Your Voice.<br />
              <span className="text-white/70">Your Campus.</span>
            </h1>
          </div>
          <p className="text-base font-medium text-white/70 leading-relaxed max-w-sm">
            A unified platform for student governance, announcements, proposals, and direct communication with campus administration.
          </p>

          {/* Feature list */}
          <div className="grid gap-3 pt-2">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.label} className="flex items-center gap-3.5 rounded-2xl bg-white/8 px-4 py-3 ring-1 ring-white/10 backdrop-blur-sm">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15">
                    <Icon size={16} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-white">{f.label}</p>
                    <p className="text-[11px] font-medium text-white/55">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer tagline */}
        <p className="relative z-10 text-[11px] font-bold text-white/30 uppercase tracking-widest">
          BatStateU · Governance Digital Layer
        </p>
      </div>

      {/* ── Right Form Panel ────────────────────────────────────── */}
      <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-[420px] space-y-4">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden mb-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white ring-1 ring-slate-200 shadow overflow-hidden">
              <ConcensusLogo size={28} />
            </div>
            <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">Concensus</span>
          </div>

          {/* Form card — fixed min-height prevents layout shift between login/signup */}
          <div className="rounded-[24px] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-7 shadow-[0_20px_60px_rgba(15,23,42,0.08)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.4)] min-h-[420px]">

            <div className="mb-6">
              <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                {isRecoveryMode ? "Reset Password" : isLoginMode ? "Welcome back" : "Create account"}
              </h2>
              <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                {isRecoveryMode
                  ? "Create a new secure password for your account."
                  : isLoginMode
                    ? "Sign in to access the campus governance platform."
                    : "Join the campus governance community."}
              </p>
            </div>

            {/* Mode switcher */}
            {!isRecoveryMode && (
              <div className="mb-5 flex items-center gap-1 rounded-[14px] bg-slate-100 dark:bg-slate-800 p-1">
                {["login", "signup"].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => switchMode(m)}
                    className={`flex-1 rounded-[11px] px-4 py-2 text-sm font-bold transition-all ${
                      mode === m
                        ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                    }`}
                  >
                    {m === "login" ? "Sign In" : "Sign Up"}
                  </button>
                ))}
              </div>
            )}

            {/* Google */}
            {!isRecoveryMode && (
              <>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleSubmitting || isSubmitting}
                  className="mb-4 inline-flex w-full items-center justify-center gap-2.5 rounded-[14px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-200 transition-all hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md disabled:opacity-60"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/>
                    <path fill="#34A853" d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.615 24 12.255 24z"/>
                    <path fill="#FBBC05" d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 000 10.76l3.98-3.09z"/>
                    <path fill="#EA4335" d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.64 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/>
                  </svg>
                  {isGoogleSubmitting ? "Redirecting…" : "Continue with Google"}
                </button>
                <div className="mb-4 flex items-center gap-3">
                  <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">or</span>
                  <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                </div>
              </>
            )}

            {/* Form fields */}
            <form className="space-y-4" onSubmit={handleSubmit}>
              {isSignupMode && (
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Full Name</span>
                  <div className="relative">
                    <UserRound size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required={isSignupMode}
                      placeholder="Your full name"
                      className="w-full rounded-[12px] border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2.5 pl-10 pr-3 text-sm font-medium text-slate-700 dark:text-slate-200 outline-none transition-all focus:border-[#800000] focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-[#800000]/10"
                    />
                  </div>
                </label>
              )}

              {!isRecoveryMode && (
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@school.edu.ph"
                    className="w-full rounded-[12px] border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 outline-none transition-all focus:border-[#800000] focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-[#800000]/10"
                  />
                </label>
              )}

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  {isRecoveryMode ? "New Password" : "Password"}
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder={isRecoveryMode ? "Enter your new password" : "Enter your password"}
                  className="w-full rounded-[12px] border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 outline-none transition-all focus:border-[#800000] focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-[#800000]/10"
                />
              </label>

              {(isSignupMode || isRecoveryMode) && (
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Confirm Password</span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Re-enter your password"
                    className="w-full rounded-[12px] border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 outline-none transition-all focus:border-[#800000] focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-[#800000]/10"
                  />
                </label>
              )}

              {isLoginMode && (
                <div className="-mt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={isResetRequesting || isSubmitting}
                    className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-[#800000] dark:hover:text-red-400 transition-colors disabled:opacity-60"
                  >
                    <CircleHelp size={12} />
                    {isResetRequesting ? "Sending reset link…" : "Forgot password?"}
                  </button>
                </div>
              )}

              {feedback && (
                <p className={`rounded-[10px] border px-3.5 py-2.5 text-sm font-medium ${
                  feedback.toLowerCase().includes("error") || feedback.includes("failed") || feedback.includes("do not match")
                    ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800/50 dark:bg-rose-900/20 dark:text-rose-400"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-900/20 dark:text-emerald-400"
                }`}>
                  {feedback}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-brand-glow mt-1 inline-flex w-full items-center justify-center gap-2 rounded-[12px] bg-[#800000] px-4 py-3 text-sm font-black uppercase tracking-wider text-white transition-all hover:bg-[#a00000] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-red-900/25 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isRecoveryMode && <ShieldCheck size={16} />}
                {isLoginMode && <LogIn size={16} />}
                {isSignupMode && <UserPlus size={16} />}
                {isSubmitting ? "Please wait…" : isRecoveryMode ? "Update Password" : isLoginMode ? "Sign In" : "Create Account"}
              </button>
            </form>
          </div>

          {/* Guest mode */}
          {!isRecoveryMode && (
            <div className="rounded-[18px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex items-center justify-between gap-4 shadow-sm">
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Guest Access</p>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Browse with limited read-only access.</p>
              </div>
              <button
                type="button"
                onClick={handleGuestMode}
                className="shrink-0 inline-flex items-center gap-1.5 rounded-[10px] border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 transition-all"
              >
                <UserRoundCheck size={14} />
                Continue as Guest
              </button>
            </div>
          )}

          {isRecoveryMode && (
            <button
              type="button"
              onClick={() => switchMode("login")}
              className="w-full rounded-[12px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
              ← Back to Sign In
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
