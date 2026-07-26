import { useEffect, useState, type ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Apple,
  BarChart3,
  Bell,
  ChevronLeft,
  Dumbbell,
  Heart,
  Home,
  Menu,
  MessageCircle,
  Newspaper,
  Plus,
  Salad,
  UserPlus,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { useFitness } from "../data/FitnessContext";
import { getSeenIds, markSeen } from "../lib/notificationsSeen";
import { formatRelativeTime } from "../lib/time";
import type { NotificationItem } from "../types";

const nav = [
  { to: "/fitness", label: "Übersicht", icon: Home, end: true },
  { to: "/fitness/training", label: "Training", icon: Dumbbell },
  { to: "/fitness/exercises", label: "Übungen", icon: Plus },
  { to: "/fitness/progress", label: "Fortschritt", icon: BarChart3 },
  { to: "/fitness/nutrition", label: "Ernährung", icon: Salad },
  { to: "/fitness/feed", label: "Feed", icon: Newspaper },
  { to: "/fitness/friends", label: "Freunde", icon: Users },
  { to: "/fitness/profile", label: "Profil", icon: UserRound },
];
const mobile = nav.slice(0, 5);
const LOGO_MARK = `${import.meta.env.BASE_URL}logo-fitness-mark.png`;
const LOGO_FULL = `${import.meta.env.BASE_URL}logo-fitness-full.png`;
const notificationIcon = {
  friend_request: UserPlus,
  like: Heart,
  comment: MessageCircle,
};
const notificationText = (item: NotificationItem) => {
  if (item.kind === "friend_request")
    return `${item.actorDisplayName} möchte sich mit dir verbinden`;
  if (item.kind === "like")
    return `${item.actorDisplayName} hat deinen Beitrag geliked`;
  return `${item.actorDisplayName} hat kommentiert: „${item.commentBody}"`;
};
export function FitnessLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [menu, setMenu] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [seenIds, setSeenIds] = useState<Set<string>>(() => new Set());
  const { store, loadNotifications } = useFitness();
  const location = useLocation();
  const navigate = useNavigate();
  const title =
    nav.find(
      (x) =>
        location.pathname === x.to ||
        (!x.end && location.pathname.startsWith(x.to)),
    )?.label ?? "WLD Fitness";

  useEffect(() => {
    setSeenIds(getSeenIds(store.profile.id));
    loadNotifications().then(setNotifications).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.profile.id]);

  const unseenCount = notifications.filter((n) => !seenIds.has(n.id)).length;

  const markAllSeen = () => {
    if (!notifications.length) return;
    markSeen(
      store.profile.id,
      notifications.map((n) => n.id),
    );
    setSeenIds(getSeenIds(store.profile.id));
  };

  const toggleNotifications = () => {
    setNotificationsOpen((open) => {
      if (open) markAllSeen();
      return !open;
    });
  };

  const goToNotification = (item: NotificationItem) => {
    markAllSeen();
    setNotificationsOpen(false);
    navigate(item.kind === "friend_request" ? "/fitness/friends" : "/fitness/feed");
  };
  return (
    <div className={`app-shell ${collapsed ? "is-collapsed" : ""}`}>
      <aside className="sidebar">
        <div className="brand">
          <img src={LOGO_MARK} alt="WLD Fitness" />
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
              aria-expanded={notificationsOpen}
              onClick={toggleNotifications}
            >
              <Bell />
              {unseenCount > 0 && <i>{unseenCount}</i>}
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
          {notificationsOpen && (
            <div className="notifications">
              <strong>Benachrichtigungen</strong>
              {notifications.length ? (
                <ul className="notification-list">
                  {notifications.map((item) => {
                    const Icon = notificationIcon[item.kind];
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          className={`notification-item ${!seenIds.has(item.id) ? "is-unseen" : ""}`}
                          onClick={() => goToNotification(item)}
                        >
                          <span className="notification-item__icon">
                            <Icon size={15} />
                          </span>
                          <span className="notification-item__body">
                            <span>{notificationText(item)}</span>
                            <small>{formatRelativeTime(item.createdAt)}</small>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p>Keine neuen Benachrichtigungen.</p>
              )}
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
              <img src={LOGO_MARK} alt="WLD Fitness" />
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
        <img src={LOGO_MARK} alt="WLD Fitness" />
      </a>
      <div className="auth-visual">
        <img
          className="auth-visual__logo"
          src={LOGO_FULL}
          alt="WLD Fitness – Train. Track. Transform."
        />
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
