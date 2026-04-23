import { useEffect, useState } from "react";
import {
  CircleHelp,
  LogIn,
  ShieldCheck,
  UserPlus,
  UserRound,
  UserRoundCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

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

  const isLoginMode = mode === "login";
  const isSignupMode = mode === "signup";
  const isRecoveryMode = mode === "recovery";

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const searchParams = new URLSearchParams(window.location.search);
    const hashType = hashParams.get("type");
    const searchType = searchParams.get("type");

    if (hashType === "recovery" || searchType === "recovery") {
      queueMicrotask(() => {
        setMode("recovery");
        setFeedback("Set your new password below.");
      });
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setMode("recovery");
        setFeedback("Set your new password below.");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback("");
    setIsSubmitting(true);

    try {
      if (isLoginMode) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        navigate("/announcements", { replace: true });
        return;
      }

      if (isRecoveryMode) {
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters.");
        }

        if (password !== confirmPassword) {
          throw new Error("Passwords do not match.");
        }

        const { error } = await supabase.auth.updateUser({
          password,
        });

        if (error) throw error;

        await supabase.auth.signOut();

        setPassword("");
        setConfirmPassword("");
        setMode("login");
        setFeedback("Password updated. You can now sign in.");
        return;
      }

      if (password !== confirmPassword) {
        throw new Error("Passwords do not match.");
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      if (data.session) {
        navigate("/announcements", { replace: true });
      } else {
        setFeedback(
          "Account created. Check your email to confirm your account.",
        );
      }
    } catch (error) {
      setFeedback(error.message || "Authentication failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuestMode = () => {
    if (onGuestMode) onGuestMode();
    navigate("/announcements", { replace: true });
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setFeedback("Enter your email first so we can send the reset link.");
      return;
    }

    setFeedback("");
    setIsResetRequesting(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/auth`,
        },
      );

      if (error) throw error;

      setFeedback("Password reset email sent. Check your inbox.");
    } catch (error) {
      setFeedback(error.message || "Unable to send reset email right now.");
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
        options: {
          redirectTo: `${window.location.origin}/announcements`,
        },
      });

      if (error) throw error;
    } catch (error) {
      setFeedback(error.message || "Google sign-in failed. Please try again.");
      setIsGoogleSubmitting(false);
    }
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setFeedback("");
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#f8f9fb] to-[#f2f4f7] px-4 py-8 overflow-y-auto">
      <section className="soft-enter w-full max-w-[460px] rounded-[20px] border border-slate-200/90 bg-white p-6 shadow-[0_16px_34px_rgba(15,23,42,0.08)] sm:p-7">
        <p className="m-0 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
          Academic Monolith
        </p>
        <h1 className="m-0 mt-2 text-[1.9rem] font-semibold leading-tight text-slate-900">
          Welcome to Concensus
        </h1>
        <p className="m-0 mt-1.5 text-sm text-slate-600">
          {isRecoveryMode
            ? "Create a new secure password for your account."
            : "Sign in to access announcements, forum discussions, and governance chat."}
        </p>

        {!isRecoveryMode && (
          <div className="mt-5 flex items-center gap-2 rounded-[12px] bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`flex-1 rounded-[10px] px-3 py-2 text-sm font-semibold transition-colors ${
                isLoginMode
                  ? "bg-white text-slate-900"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className={`flex-1 rounded-[10px] px-3 py-2 text-sm font-semibold transition-colors ${
                isSignupMode
                  ? "bg-white text-slate-900"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Sign Up
            </button>
          </div>
        )}

        {!isRecoveryMode && (
          <>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleSubmitting || isSubmitting}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-[12px] border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 bg-white text-xs font-bold text-slate-700">
                G
              </span>
              {isGoogleSubmitting ? "Redirecting..." : "Continue with Google"}
            </button>

            <div className="mt-4 flex items-center gap-2">
              <span className="h-px flex-1 bg-slate-200" />
              <span className="text-xs uppercase tracking-[0.08em] text-slate-500">
                or
              </span>
              <span className="h-px flex-1 bg-slate-200" />
            </div>
          </>
        )}

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          {isSignupMode && (
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Full Name
              </span>
              <div className="relative">
                <UserRound
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  required={isSignupMode}
                  placeholder="Your full name"
                  className="w-full rounded-[12px] border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-700 outline-none transition-colors focus:border-[#7f1d1d]"
                />
              </div>
            </label>
          )}

          {!isRecoveryMode && (
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Email
              </span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                placeholder="name@school.edu"
                className="w-full rounded-[12px] border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition-colors focus:border-[#7f1d1d]"
              />
            </label>
          )}

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              {isRecoveryMode ? "New Password" : "Password"}
            </span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              placeholder={
                isRecoveryMode
                  ? "Enter your new password"
                  : "Enter your password"
              }
              className="w-full rounded-[12px] border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition-colors focus:border-[#7f1d1d]"
            />
          </label>

          {(isSignupMode || isRecoveryMode) && (
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Confirm Password
              </span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                placeholder="Re-enter your password"
                className="w-full rounded-[12px] border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition-colors focus:border-[#7f1d1d]"
              />
            </label>
          )}

          {isLoginMode && (
            <div className="-mt-1 flex justify-end">
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={isResetRequesting || isSubmitting}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 transition-colors hover:text-slate-900 disabled:opacity-70"
              >
                <CircleHelp size={13} />
                {isResetRequesting
                  ? "Sending reset link..."
                  : "Forgot password?"}
              </button>
            </div>
          )}

          {feedback && (
            <p className="m-0 rounded-[10px] border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {feedback}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-[12px] bg-[#7f1d1d] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#991b1b] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isRecoveryMode ? <ShieldCheck size={16} /> : null}
            {isLoginMode ? <LogIn size={16} /> : null}
            {isSignupMode ? <UserPlus size={16} /> : null}
            {isSubmitting
              ? "Please wait..."
              : isRecoveryMode
                ? "Update Password"
                : isLoginMode
                  ? "Sign In"
                  : "Create Account"}
          </button>
        </form>

        {!isRecoveryMode && (
          <div className="mt-6 space-y-2 rounded-[14px] border border-slate-200 bg-slate-50 p-4">
            <p className="m-0 text-sm font-semibold text-slate-800">
              Guest Mode
            </p>
            <p className="m-0 text-sm text-slate-600">
              Browse the platform using static demo access while preparing your
              account.
            </p>
            <button
              type="button"
              onClick={handleGuestMode}
              className="mt-1 inline-flex items-center gap-2 rounded-[10px] border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
            >
              <UserRoundCheck size={16} />
              Continue as Guest
            </button>
          </div>
        )}

        {isRecoveryMode && (
          <button
            type="button"
            onClick={() => switchMode("login")}
            className="mt-4 w-full rounded-[10px] border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
          >
            Back to Sign In
          </button>
        )}
      </section>
    </div>
  );
}

export default AuthPage;
