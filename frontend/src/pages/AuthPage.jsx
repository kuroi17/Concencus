import { useState } from "react";
import { LogIn, UserPlus, UserRound, UserRoundCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

function AuthPage({ onGuestMode }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  const isLoginMode = mode === "login";

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8f9fb] to-[#f2f4f7] px-3 py-6 sm:px-5 lg:px-8">
      <div className="mx-auto grid w-full max-w-[1080px] gap-4 md:grid-cols-[1.05fr_1fr]">
        <section className="soft-enter rounded-[18px] border border-slate-200/90 bg-white p-6 shadow-[0_14px_30px_rgba(15,23,42,0.08)]">
          <p className="m-0 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
            Academic Monolith
          </p>
          <h1 className="m-0 mt-2 text-[2rem] font-semibold leading-tight text-slate-900">
            Welcome to Concensus
          </h1>
          <p className="m-0 mt-2 text-sm leading-relaxed text-slate-600">
            Access announcements, forum discussions, and governance chat in one
            place.
          </p>

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
        </section>

        <section className="soft-enter rounded-[18px] border border-slate-200/90 bg-white p-6 shadow-[0_14px_30px_rgba(15,23,42,0.08)]">
          <div className="flex items-center gap-2 rounded-[12px] bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setFeedback("");
              }}
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
              onClick={() => {
                setMode("signup");
                setFeedback("");
              }}
              className={`flex-1 rounded-[10px] px-3 py-2 text-sm font-semibold transition-colors ${
                !isLoginMode
                  ? "bg-white text-slate-900"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Sign Up
            </button>
          </div>

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

          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            {!isLoginMode && (
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
                    required={!isLoginMode}
                    placeholder="Your full name"
                    className="w-full rounded-[12px] border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-700 outline-none transition-colors focus:border-[#7f1d1d]"
                  />
                </div>
              </label>
            )}

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

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Password
              </span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                placeholder="Enter your password"
                className="w-full rounded-[12px] border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition-colors focus:border-[#7f1d1d]"
              />
            </label>

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
              {isLoginMode ? <LogIn size={16} /> : <UserPlus size={16} />}
              {isSubmitting
                ? "Please wait..."
                : isLoginMode
                  ? "Sign In"
                  : "Create Account"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

export default AuthPage;
