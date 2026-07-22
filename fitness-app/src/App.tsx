import { Suspense, lazy, useEffect, useState, type ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
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

function Protected({
  children,
  bare = false,
}: {
  children: ReactNode;
  bare?: boolean;
}) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSkeleton />;
  if (!user) return <Navigate to="/fitness/login" replace />;
  return (
    <FitnessProvider>
      {bare ? children : <FitnessLayout>{children}</FitnessLayout>}
    </FitnessProvider>
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
              <Route
                path="/fitness"
                element={
                  <Protected>
                    <Dashboard />
                  </Protected>
                }
              />
              <Route
                path="/fitness/training"
                element={
                  <Protected>
                    <TrainingPlans />
                  </Protected>
                }
              />
              <Route
                path="/fitness/training/new"
                element={
                  <Protected>
                    <WorkoutPlanForm />
                  </Protected>
                }
              />
              <Route
                path="/fitness/training/:workoutId"
                element={
                  <Protected bare>
                    <ActiveWorkout />
                  </Protected>
                }
              />
              <Route
                path="/fitness/exercises"
                element={
                  <Protected>
                    <Exercises />
                  </Protected>
                }
              />
              <Route
                path="/fitness/progress"
                element={
                  <Protected>
                    <Progress />
                  </Protected>
                }
              />
              <Route
                path="/fitness/nutrition"
                element={
                  <Protected>
                    <Nutrition />
                  </Protected>
                }
              />
              <Route
                path="/fitness/profile"
                element={
                  <Protected>
                    <Profile />
                  </Protected>
                }
              />
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
