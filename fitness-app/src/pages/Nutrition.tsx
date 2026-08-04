import { useState } from "react";
import { Droplet, Edit3, Flame, Plus, ScanLine, Trash2, X } from "lucide-react";
import { useFitness } from "../data/FitnessContext";
import { useAuth } from "../auth/AuthContext";
import { ConfirmDialog, useModalA11y, useToast } from "../components/ui";
import BarcodeScanner, {
  type ScannedMeal,
} from "../components/BarcodeScanner";
import NutritionTrend from "../components/NutritionTrend";
import {
  getRecentScans,
  recordRecentScan,
  removeRecentScan,
  type RecentScan,
} from "../lib/recentScans";
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
  const percent = Math.min(100, (value / Math.max(1, target)) * 100);
  return (
    <div className="macro">
      <div>
        <span>{label}</span>
        <b>
          {value} / {target} g
        </b>
      </div>
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={target}
        aria-label={label}
      >
        <i style={{ width: `${percent}%`, background: color }} />
      </div>
    </div>
  );
}
export default function Nutrition() {
  const { store, saveMeal, deleteMeal, saveGoal, addWaterLog, deleteWaterLog } =
    useFitness();
  const { user } = useAuth();
  const userId = user?.id ?? "anonymous";
  const toast = useToast();
  const [editing, setEditing] = useState<Meal | null | undefined>(undefined);
  const [remove, setRemove] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [recentScans, setRecentScans] = useState<RecentScan[]>(() =>
    getRecentScans(userId),
  );
  const [savingMeal, setSavingMeal] = useState(false);
  const [savingGoal, setSavingGoal] = useState(false);
  const mealDialogRef = useModalA11y<HTMLFormElement>(
    editing !== undefined,
    () => setEditing(undefined),
  );

  const rememberScan = (scan: RecentScan) =>
    setRecentScans(recordRecentScan(userId, scan));

  const addScannedMeal = async (scanned: ScannedMeal) => {
    try {
      await saveMeal({
        id: crypto.randomUUID(),
        name: scanned.name,
        eatenAt: new Date().toISOString(),
        calories: scanned.calories,
        proteinG: scanned.proteinG,
        carbsG: scanned.carbsG,
        fatG: scanned.fatG,
      });
      rememberScan({
        barcode: scanned.barcode,
        name: scanned.name,
        brand: scanned.brand,
        imageUrl: scanned.imageUrl,
        grams: scanned.grams,
        calories: scanned.calories,
        proteinG: scanned.proteinG,
        carbsG: scanned.carbsG,
        fatG: scanned.fatG,
        lastUsedAt: new Date().toISOString(),
      });
      setScanning(false);
      toast("Mahlzeit aus Scan hinzugefügt");
    } catch {
      toast("Mahlzeit konnte nicht gespeichert werden", "error");
    }
  };

  const addWater = async (amountMl: number) => {
    try {
      await addWaterLog(amountMl);
    } catch {
      toast("Wasser konnte nicht gespeichert werden", "error");
    }
  };

  const undoWater = async (id: string) => {
    try {
      await deleteWaterLog(id);
    } catch {
      toast("Eintrag konnte nicht rückgängig gemacht werden", "error");
    }
  };

  const quickAddScan = async (scan: RecentScan) => {
    try {
      await saveMeal({
        id: crypto.randomUUID(),
        name: scan.name,
        eatenAt: new Date().toISOString(),
        calories: scan.calories,
        proteinG: scan.proteinG,
        carbsG: scan.carbsG,
        fatG: scan.fatG,
      });
      rememberScan({ ...scan, lastUsedAt: new Date().toISOString() });
      toast(`${scan.name} hinzugefügt`);
    } catch {
      toast("Mahlzeit konnte nicht gespeichert werden", "error");
    }
  };

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
  const todayWater = store.waterLogs.filter(
    (w) => new Date(w.loggedAt).toDateString() === new Date().toDateString(),
  );
  const totalWaterMl = todayWater.reduce((sum, w) => sum + w.amountMl, 0);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    setSavingMeal(true);
    try {
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
    } catch {
      toast("Mahlzeit konnte nicht gespeichert werden", "error");
    } finally {
      setSavingMeal(false);
    }
  };
  return (
    <div className="stack-page">
      <div className="page-title">
        <div>
          <p>TAGESÜBERSICHT</p>
          <h2>Ernährung</h2>
        </div>
        <div className="page-title__actions">
          <button
            className="button button--secondary"
            onClick={() => setScanning(true)}
          >
            <ScanLine /> Scannen
          </button>
          <button
            className="button button--primary"
            onClick={() => setEditing(null)}
          >
            <Plus /> Mahlzeit
          </button>
        </div>
      </div>

      {recentScans.length > 0 && (
        <section className="card recent-scans">
          <div className="card__head">
            <h2>Zuletzt gescannt</h2>
          </div>
          <div className="recent-scans__list">
            {recentScans.map((scan) => (
              <div className="recent-scans__item" key={scan.barcode}>
                <button type="button" onClick={() => void quickAddScan(scan)}>
                  {scan.imageUrl ? (
                    <img src={scan.imageUrl} alt="" />
                  ) : (
                    <span className="scanner-search__placeholder" />
                  )}
                  <span>
                    <strong>{scan.name}</strong>
                    <small>
                      {scan.calories} kcal · {scan.grams} g
                    </small>
                  </span>
                </button>
                <button
                  type="button"
                  className="recent-scans__remove"
                  aria-label={`${scan.name} aus Verlauf entfernen`}
                  onClick={() =>
                    setRecentScans(removeRecentScan(userId, scan.barcode))
                  }
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="nutrition-grid">
        <section className="card calorie-card">
          <div
            className="calorie-ring"
            role="progressbar"
            aria-valuenow={total.calories}
            aria-valuemin={0}
            aria-valuemax={store.nutritionGoal.calories}
            aria-label="Kalorien"
            style={
              {
                "--p": `${Math.min(100, (total.calories / Math.max(1, store.nutritionGoal.calories)) * 100)}%`,
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
              setSavingGoal(true);
              try {
                await saveGoal({
                  calories: Math.max(1, +String(d.get("calories")) || 1),
                  proteinG: Math.max(0, +String(d.get("protein")) || 0),
                  carbsG: Math.max(0, +String(d.get("carbs")) || 0),
                  fatG: Math.max(0, +String(d.get("fat")) || 0),
                  waterMl: Math.max(1, +String(d.get("water")) || 1),
                });
                toast("Ziele gespeichert");
              } catch {
                toast("Ziele konnten nicht gespeichert werden", "error");
              } finally {
                setSavingGoal(false);
              }
            }}
          >
            <label>
              Kalorien
              <input
                name="calories"
                type="number"
                min="1"
                required
                defaultValue={store.nutritionGoal.calories}
              />
            </label>
            <label>
              Protein (g)
              <input
                name="protein"
                type="number"
                min="0"
                required
                defaultValue={store.nutritionGoal.proteinG}
              />
            </label>
            <label>
              Kohlenhydrate (g)
              <input
                name="carbs"
                type="number"
                min="0"
                required
                defaultValue={store.nutritionGoal.carbsG}
              />
            </label>
            <label>
              Fett (g)
              <input
                name="fat"
                type="number"
                min="0"
                required
                defaultValue={store.nutritionGoal.fatG}
              />
            </label>
            <label>
              Wasser (ml)
              <input
                name="water"
                type="number"
                min="1"
                required
                defaultValue={store.nutritionGoal.waterMl}
              />
            </label>
            <button className="button button--secondary" disabled={savingGoal}>
              {savingGoal ? "Speichert…" : "Ziele speichern"}
            </button>
          </form>
        </section>
        <section className="card water-card">
          <div className="card__head">
            <h2>
              <Droplet size={16} /> Wasser
            </h2>
            <b>
              {totalWaterMl} / {store.nutritionGoal.waterMl} ml
            </b>
          </div>
          <div
            className="mini-progress"
            role="progressbar"
            aria-valuenow={totalWaterMl}
            aria-valuemin={0}
            aria-valuemax={store.nutritionGoal.waterMl}
            aria-label="Wasser"
          >
            <i
              style={{
                width: `${Math.min(100, (totalWaterMl / Math.max(1, store.nutritionGoal.waterMl)) * 100)}%`,
              }}
            />
          </div>
          <div className="water-actions">
            <button
              type="button"
              className="button button--secondary"
              onClick={() => void addWater(250)}
            >
              +250 ml
            </button>
            <button
              type="button"
              className="button button--secondary"
              onClick={() => void addWater(500)}
            >
              +500 ml
            </button>
            <button
              type="button"
              className="button button--secondary"
              onClick={() => void addWater(750)}
            >
              +750 ml
            </button>
          </div>
          {todayWater.length > 0 && (
            <button
              type="button"
              className="scanner-link"
              onClick={() => void undoWater(todayWater[0].id)}
            >
              Letzten Eintrag rückgängig
            </button>
          )}
        </section>
      </div>

      <NutritionTrend meals={store.meals} calorieGoal={store.nutritionGoal.calories} />

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
        <div
          className="modal"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setEditing(undefined);
          }}
        >
          <form
            className="dialog form-dialog"
            onSubmit={submit}
            ref={mealDialogRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="meal-dialog-title"
          >
            <button
              type="button"
              className="dialog-close"
              onClick={() => setEditing(undefined)}
            >
              <X />
            </button>
            <h2 id="meal-dialog-title">
              {editing ? "Mahlzeit bearbeiten" : "Mahlzeit hinzufügen"}
            </h2>
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
            <button className="button button--primary" disabled={savingMeal}>
              {savingMeal ? "Speichert…" : "Speichern"}
            </button>
          </form>
        </div>
      )}
      {scanning && (
        <BarcodeScanner
          onClose={() => setScanning(false)}
          onConfirm={(meal) => void addScannedMeal(meal)}
        />
      )}
      <ConfirmDialog
        open={Boolean(remove)}
        title="Mahlzeit löschen?"
        message="Der Eintrag wird aus der Tagesübersicht entfernt."
        danger
        onCancel={() => setRemove(null)}
        onConfirm={async () => {
          if (remove) {
            try {
              await deleteMeal(remove);
              toast("Mahlzeit gelöscht");
            } catch {
              toast("Mahlzeit konnte nicht gelöscht werden", "error");
            }
          }
          setRemove(null);
        }}
      />
    </div>
  );
}
