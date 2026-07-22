import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CalendarCheck,
  Clock3,
  Dumbbell,
  Flame,
  Scale,
  Trophy,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useFitness } from "../data/FitnessContext";
import { EmptyState, LoadingSkeleton } from "../components/ui";

function MetricCard({
  icon: Icon,
  label,
  value,
  note,
  progress,
}: {
  icon: typeof Dumbbell;
  label: string;
  value: string;
  note: string;
  progress?: number;
}) {
  return (
    <article className="metric-card">
      <span className="metric-card__icon">
        <Icon />
      </span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
        <p>{note}</p>
        {progress !== undefined && (
          <div className="mini-progress">
            <i style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>
    </article>
  );
}
export function WeeklyProgressChart({
  sessions,
}: {
  sessions: ReturnType<typeof useFitness>["store"]["sessions"];
}) {
  const labels = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  const data = labels.map((day, index) => {
    const start = new Date(monday);
    start.setDate(start.getDate() + index);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return {
      day,
      volume: sessions
        .filter((s) => {
          const d = new Date(s.startedAt);
          return d >= start && d < end && s.status === "completed";
        })
        .reduce((n, s) => n + s.totalVolumeKg, 0),
    };
  });
  return (
    <section className="card chart-card">
      <div className="card__head">
        <div>
          <h2>Wochenfortschritt</h2>
          <p>Bewegtes Gewicht pro Tag</p>
        </div>
        <span>Ziel: 20.000 kg</span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data}>
          <CartesianGrid stroke="#1e2933" vertical={false} />
          <XAxis
            dataKey="day"
            stroke="#7f8994"
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            stroke="#7f8994"
            axisLine={false}
            tickLine={false}
            width={38}
          />
          <Tooltip
            contentStyle={{
              background: "#09111a",
              border: "1px solid #27323d",
              borderRadius: 10,
            }}
          />
          <Bar dataKey="volume" fill="#e52b32" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <div className="chart-legend">
        <strong>
          {data.reduce((n, x) => n + x.volume, 0).toLocaleString("de-CH")} kg
        </strong>
        <span>Wochenvolumen</span>
      </div>
    </section>
  );
}
function TodaysWorkoutCard() {
  const { store } = useFitness();
  const plan = store.plans[0];
  const active = store.sessions.find((s) => s.status === "active");
  if (!plan)
    return (
      <section className="card">
        <EmptyState
          title="Noch kein Training"
          text="Erstelle deinen ersten Trainingsplan."
          action={
            <Link className="button button--primary" to="/fitness/training/new">
              Plan erstellen
            </Link>
          }
        />
      </section>
    );
  const completed = active?.sets.filter((s) => s.completed).length ?? 0;
  const total =
    active?.sets.length || plan.exercises.reduce((n, e) => n + e.sets, 0);
  return (
    <section className="card today-card">
      <div className="today-card__art">
        <Dumbbell />
      </div>
      <div className="card__head">
        <span>Heutiges Training</span>
      </div>
      <h2>{plan.name}</h2>
      <p>{plan.muscleGroups.join(" · ")}</p>
      <small>
        {plan.exercises.length} Übungen · ca. {plan.estimatedMinutes} Min.
      </small>
      <div className="today-progress">
        <span>
          Fortschritt{" "}
          <b>
            {completed} / {total} Sätze
          </b>
        </span>
        <div className="segmented">
          <i style={{ width: `${total ? (completed / total) * 100 : 0}%` }} />
        </div>
      </div>
      <Link
        className="button button--primary"
        to={`/fitness/training/${active?.id ?? plan.id}`}
      >
        {active ? "Workout fortsetzen" : "Workout starten"} <span>→</span>
      </Link>
    </section>
  );
}
function Upcoming() {
  const { store } = useFitness();
  const plan = store.plans[0];
  return (
    <section className="card compact-card">
      <h2>Nächste Übungen</h2>
      {!plan ? (
        <EmptyState title="Keine Übungen" text="Wähle einen Trainingsplan." />
      ) : (
        <div className="upcoming-list">
          {plan.exercises.slice(0, 3).map((pe, index) => {
            const ex = store.exercises.find((e) => e.id === pe.exerciseId);
            return (
              <Link to={`/fitness/training/${plan.id}`} key={pe.id}>
                <b>{index + 1}</b>
                <span>
                  <strong>{ex?.name ?? "Übung"}</strong>
                  <small>
                    {pe.sets} × {pe.reps}
                  </small>
                </span>
                <em>›</em>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
function BodyProgress() {
  const { store } = useFitness();
  const data = store.measurements.map((m) => ({
    date: new Date(m.measuredAt).toLocaleDateString("de-CH", {
      day: "2-digit",
      month: "short",
    }),
    kg: m.weightKg,
  }));
  const current = data.at(-1)?.kg ?? store.profile.currentWeightKg;
  const first = data[0]?.kg ?? current;
  return (
    <section className="card compact-card">
      <div className="card__head">
        <h2>Körperentwicklung</h2>
        <div className="weight-now">
          <strong>{current.toFixed(1)}</strong> kg{" "}
          <small>
            {current - first > 0 ? "+" : ""}
            {(current - first).toFixed(1)} kg
          </small>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data}>
          <defs>
            <linearGradient id="redfade">
              <stop offset="0" stopColor="#e52b32" />
              <stop offset="1" stopColor="#a11f25" />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#1e2933" vertical={false} />
          <XAxis dataKey="date" hide />
          <YAxis domain={["dataMin - 2", "dataMax + 2"]} hide />
          <Tooltip
            contentStyle={{
              background: "#09111a",
              border: "1px solid #27323d",
            }}
          />
          <Line
            dataKey="kg"
            stroke="url(#redfade)"
            strokeWidth={3}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
      <Link className="card-link" to="/fitness/progress">
        Verlauf anzeigen <span>›</span>
      </Link>
    </section>
  );
}
function Records() {
  const { store } = useFitness();
  return (
    <section className="card compact-card">
      <h2>Persönliche Bestleistungen</h2>
      <div className="records">
        {store.records.slice(0, 3).map((r) => (
          <div key={r.id}>
            <span>
              <Trophy />
              <b>{r.exerciseName}</b>
            </span>
            <strong>{r.weightKg} kg</strong>
          </div>
        ))}
      </div>
      <Link className="card-link" to="/fitness/progress">
        Alle Bestleistungen <span>›</span>
      </Link>
    </section>
  );
}
function WeeklyStreak() {
  const { store } = useFitness();
  const days = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
  const completed = new Set(
    store.sessions
      .filter((s) => s.status === "completed")
      .map((s) => new Date(s.startedAt).getDay()),
  );
  return (
    <section className="card streak-card">
      <div>
        <h2>Deine Woche</h2>
        <strong>
          <Flame />{" "}
          {Math.max(
            1,
            store.sessions.filter((s) => s.status === "completed").length,
          )}{" "}
          Tage Serie
        </strong>
      </div>
      <div className="streak-days">
        {days.map((d, i) => (
          <span key={d}>
            <small>{d}</small>
            <b className={completed.has((i + 1) % 7) ? "done" : ""}>
              {completed.has((i + 1) % 7) ? "✓" : "–"}
            </b>
          </span>
        ))}
      </div>
    </section>
  );
}
export default function Dashboard() {
  const { store, loading } = useFitness();
  if (loading) return <LoadingSkeleton cards={8} />;
  const completed = store.sessions.filter((s) => s.status === "completed");
  const thisWeek = completed.filter(
    (s) => Date.now() - new Date(s.startedAt).getTime() < 604800000,
  );
  const seconds = thisWeek.reduce((n, s) => n + s.durationSeconds, 0);
  const volume = thisWeek.reduce((n, s) => n + s.totalVolumeKg, 0);
  return (
    <>
      <div className="metrics">
        <MetricCard
          icon={Dumbbell}
          label="Training diese Woche"
          value={`${thisWeek.length} / ${store.profile.trainingDays}`}
          note="Workouts"
          progress={(thisWeek.length / store.profile.trainingDays) * 100}
        />
        <MetricCard
          icon={Flame}
          label="Aktuelle Serie"
          value={`${Math.max(1, completed.length)} Tage`}
          note="Weiter so!"
        />
        <MetricCard
          icon={Clock3}
          label="Trainingszeit"
          value={`${Math.floor(seconds / 3600)} h ${Math.round((seconds % 3600) / 60)} min`}
          note="Diese Woche"
        />
        <MetricCard
          icon={Scale}
          label="Volumen"
          value={`${volume.toLocaleString("de-CH")} kg`}
          note="Diese Woche"
        />
      </div>
      <div className="dashboard-grid">
        <WeeklyProgressChart sessions={store.sessions} />
        <TodaysWorkoutCard />
        <Upcoming />
        <BodyProgress />
        <Records />
      </div>
      <WeeklyStreak />
      <div className="sr-only">
        <CalendarCheck />
      </div>
    </>
  );
}
