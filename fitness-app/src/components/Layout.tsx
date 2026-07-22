import { useState, type ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Apple,
  BarChart3,
  Bell,
  ChevronLeft,
  Dumbbell,
  Home,
  Menu,
  Plus,
  Salad,
  UserRound,
  X,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { useFitness } from "../data/FitnessContext";

const nav = [
  { to: "/fitness", label: "Übersicht", icon: Home, end: true },
  { to: "/fitness/training", label: "Training", icon: Dumbbell },
  { to: "/fitness/exercises", label: "Übungen", icon: Plus },
  { to: "/fitness/progress", label: "Fortschritt", icon: BarChart3 },
  { to: "/fitness/nutrition", label: "Ernährung", icon: Salad },
  { to: "/fitness/profile", label: "Profil", icon: UserRound },
];
const mobile = nav.slice(0, 5);
export function FitnessLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [menu, setMenu] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const { store } = useFitness();
  const location = useLocation();
  const navigate = useNavigate();
  const title =
    nav.find(
      (x) =>
        location.pathname === x.to ||
        (!x.end && location.pathname.startsWith(x.to)),
    )?.label ?? "WLD Fitness";
  return (
    <div className={`app-shell ${collapsed ? "is-collapsed" : ""}`}>
      <aside className="sidebar">
        <div className="brand">
          <strong>
            WLD<span>.</span>
          </strong>
          <small>Fitness</small>
        </div>
        <nav>
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}>
              <Icon />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar__goal">
          <small>Wöchentliches Ziel</small>
          <strong>
            4 <span>/ {store.profile.trainingDays}</span>
          </strong>
          <div className="mini-progress">
            <i
              style={{
                width: `${Math.min(100, (4 / store.profile.trainingDays) * 100)}%`,
              }}
            />
          </div>
        </div>
        <button
          className="collapse"
          onClick={() => setCollapsed((v) => !v)}
          aria-label="Sidebar ein- oder ausklappen"
        >
          <ChevronLeft />
        </button>
      </aside>
      <div className="app-main">
        <header className="app-header">
          <div>
            <button
              className="mobile-menu"
              onClick={() => setMenu(true)}
              aria-label="Menü öffnen"
            >
              <Menu />
            </button>
            <div>
              <small>{title}</small>
              <h1>
                Guten{" "}
                {new Date().getHours() < 12
                  ? "Morgen"
                  : new Date().getHours() < 18
                    ? "Tag"
                    : "Abend"}
                , {store.profile.displayName?.split(" ")[0] || "Athlet"}
              </h1>
              <p>Bereit für dein nächstes Training?</p>
            </div>
          </div>
          <div className="app-header__actions">
            <button
              className="icon-button"
              aria-label="Benachrichtigungen"
              aria-expanded={notifications}
              onClick={() => setNotifications((value) => !value)}
            >
              <Bell />
              <i>2</i>
            </button>
            <button
              className="avatar"
              onClick={() => navigate("/fitness/profile")}
              aria-label="Profil öffnen"
            >
              {store.profile.avatarUrl ? (
                <img src={store.profile.avatarUrl} alt="" />
              ) : (
                <UserRound />
              )}
            </button>
            <button
              className="button button--primary desktop-start"
              onClick={() => navigate("/fitness/training")}
            >
              Training starten <span>→</span>
            </button>
          </div>
          {notifications && (
            <div className="notifications">
              <strong>Benachrichtigungen</strong>
              <p>Dein Push-Day ist heute geplant.</p>
              <p>Neue Wochenstatistik ist verfügbar.</p>
            </div>
          )}
        </header>
        <main className="page">{children}</main>
      </div>
      <nav className="bottom-nav">
        {mobile.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end}>
            <Icon />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      {menu && (
        <div
          className="mobile-drawer"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setMenu(false);
          }}
        >
          <div>
            <button onClick={() => setMenu(false)} aria-label="Menü schließen">
              <X />
            </button>
            <div className="brand">
              <strong>
                WLD<span>.</span>
              </strong>
              <small>Fitness</small>
            </div>
            {nav.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={() => setMenu(false)}
              >
                <Icon />
                {label}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function AuthLayout({ children }: { children: ReactNode }) {
  const { demoMode } = useAuth();
  return (
    <div className="auth-layout">
      <a className="brand auth-brand" href="/fitness/">
        <strong>
          WLD<span>.</span>
        </strong>
        <small>Fitness</small>
      </a>
      <div className="auth-visual">
        <Dumbbell />
        <h1>
          Stärker.
          <br />
          Jeden Tag.
        </h1>
        <p>
          Plane dein Training, verfolge deinen Fortschritt und erreiche deine
          Ziele.
        </p>
      </div>
      <div className="auth-panel">
        {demoMode && (
          <div className="demo-banner">Lokaler Entwicklungsmodus</div>
        )}
        {children}
      </div>
      <Apple className="auth-apple" />
    </div>
  );
}
