import { useState } from "react";
import { Edit3, Flame, Plus, Trash2, X } from "lucide-react";
import { useFitness } from "../data/FitnessContext";
import { ConfirmDialog, useToast } from "../components/ui";
import type { Meal } from "../types";

function Macro({
  label,
  value,
  target,
  color,
}: {
  label: string;
  value: number;
  target: number;
  color: string;
}) {
  const percent = Math.min(100, (value / target) * 100);
  return (
    <div className="macro">
      <div>
        <span>{label}</span>
        <b>
          {value} / {target} g
        </b>
      </div>
      <div>
        <i style={{ width: `${percent}%`, background: color }} />
      </div>
    </div>
  );
}
export default function Nutrition() {
  const { store, saveMeal, deleteMeal, saveGoal } = useFitness();
  const toast = useToast();
  const [editing, setEditing] = useState<Meal | null | undefined>(undefined);
  const [remove, setRemove] = useState<string | null>(null);
  const today = store.meals.filter(
    (m) => new Date(m.eatenAt).toDateString() === new Date().toDateString(),
  );
  const total = today.reduce(
    (a, m) => ({
      calories: a.calories + m.calories,
      proteinG: a.proteinG + m.proteinG,
      carbsG: a.carbsG + m.carbsG,
      fatG: a.fatG + m.fatG,
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  );
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    await saveMeal({
      id: editing?.id ?? crypto.randomUUID(),
      name: String(d.get("name")),
      eatenAt: editing?.eatenAt ?? new Date().toISOString(),
      calories: +String(d.get("calories")),
      proteinG: +String(d.get("protein")),
      carbsG: +String(d.get("carbs")),
      fatG: +String(d.get("fat")),
    });
    setEditing(undefined);
    toast("Mahlzeit gespeichert");
  };
  return (
    <div className="stack-page">
      <div className="page-title">
        <div>
          <p>TAGESÜBERSICHT</p>
          <h2>Ernährung</h2>
        </div>
        <button
          className="button button--primary"
          onClick={() => setEditing(null)}
        >
          <Plus /> Mahlzeit
        </button>
      </div>
      <div className="nutrition-grid">
        <section className="card calorie-card">
          <div
            className="calorie-ring"
            style={
              {
                "--p": `${Math.min(100, (total.calories / store.nutritionGoal.calories) * 100)}%`,
              } as React.CSSProperties
            }
          >
            <span>
              <Flame />
              <strong>{total.calories}</strong>
              <small>von {store.nutritionGoal.calories} kcal</small>
            </span>
          </div>
          <div className="macros">
            <Macro
              label="Protein"
              value={total.proteinG}
              target={store.nutritionGoal.proteinG}
              color="#ef343b"
            />
            <Macro
              label="Kohlenhydrate"
              value={total.carbsG}
              target={store.nutritionGoal.carbsG}
              color="#b8c3cd"
            />
            <Macro
              label="Fett"
              value={total.fatG}
              target={store.nutritionGoal.fatG}
              color="#7d8995"
            />
          </div>
        </section>
        <section className="card goal-card">
          <h2>Tagesziele</h2>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const d = new FormData(e.currentTarget);
              await saveGoal({
                calories: +String(d.get("calories")),
                proteinG: +String(d.get("protein")),
                carbsG: +String(d.get("carbs")),
                fatG: +String(d.get("fat")),
              });
              toast("Ziele gespeichert");
            }}
          >
            <label>
              Kalorien
              <input
                name="calories"
                type="number"
                defaultValue={store.nutritionGoal.calories}
              />
            </label>
            <label>
              Protein (g)
              <input
                name="protein"
                type="number"
                defaultValue={store.nutritionGoal.proteinG}
              />
            </label>
            <label>
              Kohlenhydrate (g)
              <input
                name="carbs"
                type="number"
                defaultValue={store.nutritionGoal.carbsG}
              />
            </label>
            <label>
              Fett (g)
              <input
                name="fat"
                type="number"
                defaultValue={store.nutritionGoal.fatG}
              />
            </label>
            <button className="button button--secondary">
              Ziele speichern
            </button>
          </form>
        </section>
      </div>
      <section className="card meals">
        <div className="card__head">
          <h2>Heutige Mahlzeiten</h2>
          <b>{today.length} Einträge</b>
        </div>
        {today.map((m) => (
          <div key={m.id}>
            <span>
              <strong>{m.name}</strong>
              <small>
                {new Date(m.eatenAt).toLocaleTimeString("de-CH", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </small>
            </span>
            <b>{m.calories} kcal</b>
            <small>
              P {m.proteinG} · K {m.carbsG} · F {m.fatG}
            </small>
            <button onClick={() => setEditing(m)}>
              <Edit3 />
            </button>
            <button onClick={() => setRemove(m.id)}>
              <Trash2 />
            </button>
          </div>
        ))}
      </section>
      {editing !== undefined && (
        <div className="modal">
          <form className="dialog form-dialog" onSubmit={submit}>
            <button
              type="button"
              className="dialog-close"
              onClick={() => setEditing(undefined)}
            >
              <X />
            </button>
            <h2>{editing ? "Mahlzeit bearbeiten" : "Mahlzeit hinzufügen"}</h2>
            <label>
              <span>Name</span>
              <input name="name" defaultValue={editing?.name} required />
            </label>
            <label>
              <span>Kalorien</span>
              <input
                name="calories"
                type="number"
                defaultValue={editing?.calories}
                required
              />
            </label>
            <div className="form-grid">
              <label>
                <span>Protein (g)</span>
                <input
                  name="protein"
                  type="number"
                  defaultValue={editing?.proteinG}
                />
              </label>
              <label>
                <span>Kohlenhydrate (g)</span>
                <input
                  name="carbs"
                  type="number"
                  defaultValue={editing?.carbsG}
                />
              </label>
              <label>
                <span>Fett (g)</span>
                <input name="fat" type="number" defaultValue={editing?.fatG} />
              </label>
            </div>
            <button className="button button--primary">Speichern</button>
          </form>
        </div>
      )}
      <ConfirmDialog
        open={Boolean(remove)}
        title="Mahlzeit löschen?"
        message="Der Eintrag wird aus der Tagesübersicht entfernt."
        danger
        onCancel={() => setRemove(null)}
        onConfirm={async () => {
          if (remove) await deleteMeal(remove);
          setRemove(null);
          toast("Mahlzeit gelöscht");
        }}
      />
    </div>
  );
}
