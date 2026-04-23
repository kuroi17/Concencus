import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import { Navigate, Route, Routes } from "react-router-dom";
import { supabase } from "./lib/supabaseClient";
import { ChannelProvider } from "./context/ChannelContext.jsx";
import { UserProvider } from "./context/UserContext.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import ChatPage from "./pages/ChatPage.jsx";
import HubPage from "./pages/HubPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import ProposalsPage from "./pages/ProposalsPage.jsx";
import TransparencyPage from "./pages/TransparencyPage.jsx";
import { ErrorBoundary } from "./components/common/ErrorBoundary";

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
    <>
      <Toaster 
        position="bottom-center"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#fff',
            borderRadius: '12px',
            fontSize: '14px',
            padding: '12px 24px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <UserProvider>
        <ChannelProvider>
          <Routes>
            <Route
              path="/"
              element={<Navigate to={isAuthorized ? "/hub" : "/auth"} replace />}
            />
            <Route
              path="/auth"
              element={
                session ? (
                  <Navigate to="/hub" replace />
                ) : (
                  <AuthPage onGuestMode={enableGuestMode} />
                )
              }
            />
            {/* ── New unified hub ──────────────────────────────────────── */}
            <Route
              path="/hub"
              element={
                <ProtectedRoute isAllowed={isAuthorized}>
                  <HubPage />
                </ProtectedRoute>
              }
            />
            {/* ── Legacy routes kept during transition ─────────────────── */}
            <Route path="/announcements" element={<Navigate to="/hub" replace />} />
            <Route path="/forum" element={<Navigate to="/hub" replace />} />
            <Route
              path="/proposals"
              element={
                <ProtectedRoute isAllowed={isAuthorized}>
                  <ProposalsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat"
              element={
                <ProtectedRoute isAllowed={Boolean(session)}>
                  <ErrorBoundary>
                    <ChatPage />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute isAllowed={Boolean(session)}>
                  <ErrorBoundary>
                    <ProfilePage />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute isAllowed={Boolean(session)}>
                  <AdminPage />
                </ProtectedRoute>
              }
            />
            <Route path="/transparency" element={<TransparencyPage />} />
            <Route
              path="*"
              element={<Navigate to={isAuthorized ? "/hub" : "/auth"} replace />}
            />
          </Routes>
        </ChannelProvider>
      </UserProvider>
    </>
  );
}

export default App;
