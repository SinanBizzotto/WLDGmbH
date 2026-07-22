import { useMemo, useState } from "react";
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
import { Award, Clock3, Dumbbell, Scale } from "lucide-react";
import { useFitness } from "../data/FitnessContext";
import { useToast } from "../components/ui";

const ranges = [
  ["7 Tage", 7],
  ["30 Tage", 30],
  ["3 Monate", 90],
  ["6 Monate", 180],
  ["1 Jahr", 365],
] as const;
export default function Progress() {
  const { store, saveMeasurement } = useFitness();
  const toast = useToast();
  const [days, setDays] = useState<number>(90);
  const sessions = useMemo(
    () =>
      store.sessions.filter(
        (s) =>
          s.status === "completed" &&
          Date.now() - new Date(s.startedAt).getTime() <= days * 86400000,
      ),
    [store.sessions, days],
  );
  const measurements = store.measurements
    .filter(
      (m) => Date.now() - new Date(m.measuredAt).getTime() <= days * 86400000,
    )
    .map((m) => ({
      date: new Date(m.measuredAt).toLocaleDateString("de-CH", {
        day: "2-digit",
        month: "short",
      }),
      kg: m.weightKg,
    }));
  const volume = [...sessions].reverse().map((s) => ({
    date: new Date(s.startedAt).toLocaleDateString("de-CH", {
      day: "2-digit",
      month: "short",
    }),
    kg: s.totalVolumeKg,
  }));
  const addWeight = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await saveMeasurement({
      id: crypto.randomUUID(),
      measuredAt: new Date().toISOString(),
      weightKg: Number(form.get("weight")),
    });
    e.currentTarget.reset();
    toast("Gewicht gespeichert");
  };
  return (
    <div className="stack-page">
      <div className="page-title">
        <div>
          <p>DEINE ENTWICKLUNG</p>
          <h2>Fortschritt</h2>
        </div>
        <div className="range-tabs">
          {ranges.map(([label, value]) => (
            <button
              className={days === value ? "active" : ""}
              onClick={() => setDays(value)}
              key={value}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="progress-metrics">
        <div className="card">
          <Scale />
          <span>Aktuelles Gewicht</span>
          <strong>
            {(measurements.at(-1)?.kg ?? store.profile.currentWeightKg).toFixed(
              1,
            )}{" "}
            kg
          </strong>
        </div>
        <div className="card">
          <Dumbbell />
          <span>Trainingsvolumen</span>
          <strong>
            {sessions
              .reduce((n, s) => n + s.totalVolumeKg, 0)
              .toLocaleString("de-CH")}{" "}
            kg
          </strong>
        </div>
        <div className="card">
          <Award />
          <span>Workouts</span>
          <strong>{sessions.length}</strong>
        </div>
        <div className="card">
          <Clock3 />
          <span>Trainingsdauer</span>
          <strong>
            {Math.round(
              sessions.reduce((n, s) => n + s.durationSeconds, 0) / 3600,
            )}{" "}
            h
          </strong>
        </div>
      </div>
      <div className="progress-charts">
        <section className="card chart-card">
          <div className="card__head">
            <h2>Körpergewicht</h2>
            <form className="inline-form" onSubmit={addWeight}>
              <input
                name="weight"
                type="number"
                step="0.1"
                min="30"
                max="350"
                placeholder="kg"
                required
              />
              <button className="button button--primary">Eintragen</button>
            </form>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={measurements}>
              <CartesianGrid stroke="#1e2933" vertical={false} />
              <XAxis dataKey="date" stroke="#7f8994" />
              <YAxis domain={["dataMin - 2", "dataMax + 2"]} stroke="#7f8994" />
              <Tooltip
                contentStyle={{
                  background: "#09111a",
                  border: "1px solid #27323d",
                }}
              />
              <Line dataKey="kg" stroke="#ef343b" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </section>
        <section className="card chart-card">
          <h2>Volumen pro Workout</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={volume}>
              <CartesianGrid stroke="#1e2933" vertical={false} />
              <XAxis dataKey="date" stroke="#7f8994" />
              <YAxis stroke="#7f8994" />
              <Tooltip
                contentStyle={{
                  background: "#09111a",
                  border: "1px solid #27323d",
                }}
              />
              <Bar dataKey="kg" fill="#e52b32" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>
      </div>
      <section className="card records-table">
        <h2>Persönliche Bestleistungen</h2>
        {store.records.map((r) => (
          <div key={r.id}>
            <Award />
            <span>
              <strong>{r.exerciseName}</strong>
              <small>
                {new Date(r.achievedAt).toLocaleDateString("de-CH")}
              </small>
            </span>
            <b>{r.weightKg} kg</b>
          </div>
        ))}
      </section>
    </div>
  );
}
