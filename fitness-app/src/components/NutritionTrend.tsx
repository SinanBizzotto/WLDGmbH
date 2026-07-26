import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Meal } from "../types";

const ranges = [
  ["7 Tage", 7],
  ["30 Tage", 30],
] as const;

export default function NutritionTrend({
  meals,
  calorieGoal,
}: {
  meals: Meal[];
  calorieGoal: number;
}) {
  const [days, setDays] = useState<number>(7);

  const data = useMemo(() => {
    const byDay = new Map<string, number>();
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      byDay.set(d.toDateString(), 0);
    }
    meals.forEach((m) => {
      const key = new Date(m.eatenAt).toDateString();
      if (byDay.has(key)) byDay.set(key, (byDay.get(key) ?? 0) + m.calories);
    });
    return Array.from(byDay.entries()).map(([key, calories]) => ({
      date: new Date(key).toLocaleDateString("de-CH", {
        day: "2-digit",
        month: "short",
      }),
      calories,
    }));
  }, [meals, days]);

  return (
    <section className="card chart-card">
      <div className="card__head">
        <h2>Kalorien-Verlauf</h2>
        <div className="range-tabs">
          {ranges.map(([label, value]) => (
            <button
              type="button"
              className={days === value ? "active" : ""}
              onClick={() => setDays(value)}
              key={value}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data}>
          <CartesianGrid stroke="#1e2933" vertical={false} />
          <XAxis dataKey="date" stroke="#7f8994" fontSize={11} />
          <YAxis stroke="#7f8994" fontSize={11} />
          <Tooltip
            contentStyle={{ background: "#09111a", border: "1px solid #27323d" }}
          />
          <ReferenceLine
            y={calorieGoal}
            stroke="#7f8994"
            strokeDasharray="4 4"
            label={{ value: "Ziel", position: "insideTopRight", fill: "#7f8994", fontSize: 10 }}
          />
          <Bar dataKey="calories" fill="#e52b32" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </section>
  );
}
