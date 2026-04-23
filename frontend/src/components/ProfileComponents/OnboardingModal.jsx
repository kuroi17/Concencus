import { useState, useEffect } from "react";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, User, LayoutGrid, ChevronRight, Check } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { useUser } from "../../context/UserContext";
import toast from "react-hot-toast";

const steps = [
  {
    id: "welcome",
    title: "Welcome to Consensus",
    description: "Your voice shapes the future of our campus. Join the conversation, propose changes, and vote on what matters.",
    icon: Sparkles,
  },
  {
    id: "profile",
    title: "Complete Your Profile",
    description: "Let the community know who you are. This helps build trust and transparency in our governance.",
    icon: User,
  },
  {
    id: "explore",
    title: "Explore Your Hub",
    description: "Dive into your active channels. Participate in forum discussions, vote on proposals, and stay updated.",
    icon: LayoutGrid,
  }
];

export default function OnboardingModal({ isOpen, onClose, userProfile }) {
  const { refreshProfile } = useUser();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Profile Form State
  const [srCode, setSrCode] = useState(userProfile?.sr_code || "");
  const [block, setBlock] = useState(userProfile?.block || "");

  useEffect(() => {
    if (isOpen) {
      // Only set initial form values when opening or when profile first loads
      // We DO NOT reset currentStepIndex here because profile updates (refreshProfile)
      // would kick the user back to step 0.
      queueMicrotask(() => {
        setSrCode((prev) => prev || userProfile?.sr_code || "");
        setBlock((prev) => prev || userProfile?.block || "");
      });
    }
  }, [isOpen, userProfile]);

  // Handle initial step reset only once when opening
  useEffect(() => {
    if (isOpen) {
      queueMicrotask(() => {
        setCurrentStepIndex(0);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentStep = steps[currentStepIndex];

  const handleNext = async () => {
    if (isSubmitting) return;

    if (currentStepIndex === 1) {
      // Save profile info before moving to next step
      setIsSubmitting(true);
      try {
        const { error } = await supabase
          .from("user_profiles")
          .update({
            sr_code: srCode.trim() || null,
            block: block.trim() || null,
          })
          .eq("id", userProfile.id);

        if (error) throw error;
        
        // Refresh local profile state
        await refreshProfile();
      } catch (err) {
        console.error("Onboarding profile update error:", err);
        toast.error("Failed to save profile details.");
        setIsSubmitting(false);
        return;
      }
      setIsSubmitting(false);
    }

    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      await handleComplete();
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({ has_completed_onboarding: true })
        .eq("id", userProfile.id);

      if (error) throw error;
      
      // Refresh profile so HubPage knows it's done
      await refreshProfile();
      
      toast.success("Welcome aboard!");
      onClose();
    } catch (err) {
      console.error("Onboarding complete error:", err);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md">
      <div className="w-full max-w-md overflow-hidden rounded-[24px] bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800">
        
        {/* Progress Bar */}
        <div className="flex h-1.5 w-full bg-slate-100 dark:bg-slate-800">
          <div 
            className="bg-[#800000] transition-all duration-500 ease-out"
            style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
          />
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center text-center"
            >
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-red-50 dark:bg-red-900/10 text-[#800000] dark:text-red-500 shadow-inner">
                <currentStep.icon size={36} />
              </div>
              <h2 className="mb-3 text-2xl font-black text-slate-900 dark:text-white tracking-tight">{currentStep.title}</h2>
              <p className="mb-8 text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">
                {currentStep.description}
              </p>

              {currentStep.id === "profile" && (
                <div className="w-full space-y-4 mb-8 text-left">
                  <div>
                    <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      SR Code
                    </label>
                    <input
                      type="text"
                      value={srCode}
                      onChange={(e) => setSrCode(e.target.value)}
                      placeholder="e.g. 21-0000-000"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none transition-all focus:border-[#800000] focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-red-900/5 dark:focus:ring-red-500/5"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      Block/Section
                    </label>
                    <input
                      type="text"
                      value={block}
                      onChange={(e) => setBlock(e.target.value)}
                      placeholder="e.g. CS 2201"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none transition-all focus:border-[#800000] focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-red-900/5 dark:focus:ring-red-500/5"
                    />
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={handleNext}
              disabled={isSubmitting}
              className="group flex items-center gap-2 rounded-2xl bg-slate-900 dark:bg-white px-8 py-3.5 text-sm font-black text-white dark:text-slate-900 shadow-xl shadow-slate-900/20 dark:shadow-none transition-all hover:-translate-y-0.5 active:translate-y-0 hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentStepIndex === steps.length - 1 ? (
                <>Get Started <Check size={18} className="transition-transform group-hover:scale-110" /></>
              ) : (
                <>Continue <ChevronRight size={18} className="transition-transform group-hover:translate-x-0.5" /></>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
