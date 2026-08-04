import { Suspense, lazy, useEffect, useState } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { useRegisterSW } from "virtual:pwa-register/react";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { FitnessProvider } from "./data/FitnessContext";
import { FitnessLayout } from "./components/Layout";
import { LoadingSkeleton, ToastProvider } from "./components/ui";
import Dashboard from "./pages/Dashboard";
import { Login, Register } from "./pages/AuthPages";
import {
  ActiveWorkout,
  TrainingPlans,
  WorkoutPlanForm,
} from "./pages/Training";
const Exercises = lazy(() => import("./pages/Exercises"));
const Progress = lazy(() => import("./pages/Progress"));
const Nutrition = lazy(() => import("./pages/Nutrition"));
const Profile = lazy(() => import("./pages/Profile"));
const Friends = lazy(() => import("./pages/Friends"));
const Feed = lazy(() => import("./pages/Feed"));

// A single FitnessProvider instance for the whole protected route tree —
// previously each route wrapped its own <Protected><FitnessProvider>,
// so navigating between pages fully unmounted/remounted the provider
// (resetting its "synced" state and re-showing the loading skeleton on
// every click, and dropping local UI state like the sidebar's collapsed
// flag) even though react-query's own cache didn't need a refetch.
function ProtectedRoot() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSkeleton />;
  if (!user) return <Navigate to="/fitness/login" replace />;
  return (
    <FitnessProvider>
      <Outlet />
    </FitnessProvider>
  );
}
function ProtectedLayout() {
  return (
    <FitnessLayout>
      <Outlet />
    </FitnessLayout>
  );
}
function PwaUpdate() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();
  return needRefresh ? (
    <div className="pwa-update">
      <span>Eine neue Version ist verfügbar.</span>
      <button onClick={() => updateServiceWorker(true)}>Aktualisieren</button>
      <button onClick={() => setNeedRefresh(false)}>Später</button>
    </div>
  ) : null;
}
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
function PwaInstall() {
  const [event, setEvent] = useState<InstallPromptEvent | null>(null);
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const capture = (value: Event) => {
      value.preventDefault();
      setEvent(value as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", capture);
    return () => window.removeEventListener("beforeinstallprompt", capture);
  }, []);
  if (!event || hidden) return null;
  return (
    <div className="pwa-update">
      <span>WLD Fitness auf diesem Gerät installieren?</span>
      <button
        onClick={async () => {
          await event.prompt();
          await event.userChoice;
          setEvent(null);
        }}
      >
        Installieren
      </button>
      <button onClick={() => setHidden(true)}>Später</button>
    </div>
  );
}
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Suspense fallback={<LoadingSkeleton />}>
            <Routes>
              <Route path="/fitness/login" element={<Login />} />
              <Route path="/fitness/register" element={<Register />} />
              <Route element={<ProtectedRoot />}>
                <Route element={<ProtectedLayout />}>
                  <Route path="/fitness" element={<Dashboard />} />
                  <Route path="/fitness/training" element={<TrainingPlans />} />
                  <Route
                    path="/fitness/training/new"
                    element={<WorkoutPlanForm />}
                  />
                  <Route path="/fitness/exercises" element={<Exercises />} />
                  <Route path="/fitness/progress" element={<Progress />} />
                  <Route path="/fitness/nutrition" element={<Nutrition />} />
                  <Route path="/fitness/profile" element={<Profile />} />
                  <Route path="/fitness/friends" element={<Friends />} />
                  <Route path="/fitness/feed" element={<Feed />} />
                </Route>
                <Route
                  path="/fitness/training/:workoutId"
                  element={<ActiveWorkout />}
                />
              </Route>
              <Route path="*" element={<Navigate to="/fitness" replace />} />
            </Routes>
            <PwaUpdate />
            <PwaInstall />
          </Suspense>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
