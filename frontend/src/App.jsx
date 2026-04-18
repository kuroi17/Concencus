import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { supabase } from "./lib/supabaseClient";
import AnnouncementPage from "./pages/AnnouncementPage.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import ChatPage from "./pages/ChatPage.jsx";
import ForumPage from "./pages/ForumPage.jsx";

const GUEST_MODE_KEY = "concencus_guest_mode";

function ProtectedRoute({ isAllowed, children }) {
  return isAllowed ? children : <Navigate to="/auth" replace />;
}

function App() {
  const [session, setSession] = useState(null);
  const [isGuestMode, setIsGuestMode] = useState(
    () => localStorage.getItem(GUEST_MODE_KEY) === "true",
  );
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const initializeSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!isMounted) return;

      const nextSession = data.session ?? null;
      setSession(nextSession);

      if (nextSession) {
        localStorage.removeItem(GUEST_MODE_KEY);
        setIsGuestMode(false);
      }

      setIsAuthReady(true);
    };

    initializeSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null);

      if (nextSession) {
        localStorage.removeItem(GUEST_MODE_KEY);
        setIsGuestMode(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const enableGuestMode = () => {
    localStorage.setItem(GUEST_MODE_KEY, "true");
    setIsGuestMode(true);
  };

  const isAuthorized = Boolean(session) || isGuestMode;

  if (!isAuthReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#f8f9fb] to-[#f2f4f7] px-4 text-sm font-medium text-slate-600">
        Preparing your workspace...
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Navigate to={isAuthorized ? "/announcements" : "/auth"} replace />
        }
      />
      <Route
        path="/auth"
        element={
          session ? (
            <Navigate to="/announcements" replace />
          ) : (
            <AuthPage onGuestMode={enableGuestMode} />
          )
        }
      />
      <Route
        path="/announcements"
        element={
          <ProtectedRoute isAllowed={isAuthorized}>
            <AnnouncementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat"
        element={
          <ProtectedRoute isAllowed={Boolean(session)}>
            <ChatPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/forum"
        element={
          <ProtectedRoute isAllowed={isAuthorized}>
            <ForumPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="*"
        element={
          <Navigate to={isAuthorized ? "/announcements" : "/auth"} replace />
        }
      />
    </Routes>
  );
}

export default App;
