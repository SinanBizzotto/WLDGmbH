import { useState } from "react";
import { LogOut, ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useFitness } from "../data/FitnessContext";
import { supabase } from "../lib/supabase";
import { ConfirmDialog, useToast } from "../components/ui";
import { ImagePicker } from "../components/ImagePicker";

export default function Profile() {
  const { store, saveProfile } = useFitness();
  const { signOut, demoMode } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(store.profile.avatarUrl);
  const [shareTraining, setShareTraining] = useState(store.profile.shareTraining);
  const [shareWeight, setShareWeight] = useState(store.profile.shareWeight);
  const [shareNutrition, setShareNutrition] = useState(
    store.profile.shareNutrition,
  );
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    try {
      await saveProfile({
        ...store.profile,
        displayName: String(d.get("name")),
        avatarUrl: avatarUrl || undefined,
        heightCm: +String(d.get("height")),
        currentWeightKg: +String(d.get("currentWeight")),
        targetWeightKg: +String(d.get("targetWeight")),
        goal: String(d.get("goal")),
        level: String(d.get("level")),
        trainingDays: Math.min(
          7,
          Math.max(1, Math.round(+String(d.get("days")) || 1)),
        ),
        shareTraining,
        shareWeight,
        shareNutrition,
      });
      toast("Profil gespeichert");
    } catch (error) {
      toast(
        error instanceof Error
          ? `Profil konnte nicht gespeichert werden: ${error.message}`
          : "Profil konnte nicht gespeichert werden",
        "error",
      );
    }
  };
  return (
    <div className="stack-page">
      <div className="page-title">
        <div>
          <p>KONTO & EINSTELLUNGEN</p>
          <h2>Profil</h2>
        </div>
        <button
          className="button button--secondary"
          onClick={async () => {
            await signOut();
            navigate("/fitness/login");
          }}
        >
          <LogOut /> Abmelden
        </button>
      </div>
      <form className="profile-grid" onSubmit={submit}>
        <section className="card profile-card">
          <ImagePicker
            bucket="avatars"
            userId={store.profile.id}
            value={avatarUrl}
            onChange={setAvatarUrl}
            label={avatarUrl ? "Foto ändern" : "Foto hinzufügen"}
            shape="round"
          />
          <h2>{store.profile.displayName || "Dein Profil"}</h2>
          <p>
            {store.profile.goal} · {store.profile.level}
          </p>
        </section>
        <section className="card profile-form">
          <h2>Persönliche Daten</h2>
          <div className="form-grid">
            <label>
              <span>Anzeigename</span>
              <input
                name="name"
                required
                defaultValue={store.profile.displayName}
              />
            </label>
            <label>
              <span>Größe (cm)</span>
              <input
                name="height"
                type="number"
                min="100"
                max="250"
                defaultValue={store.profile.heightCm}
              />
            </label>
            <label>
              <span>Aktuelles Gewicht (kg)</span>
              <input
                name="currentWeight"
                type="number"
                step="0.1"
                defaultValue={store.profile.currentWeightKg}
              />
            </label>
            <label>
              <span>Zielgewicht (kg)</span>
              <input
                name="targetWeight"
                type="number"
                step="0.1"
                defaultValue={store.profile.targetWeightKg}
              />
            </label>
            <label>
              <span>Trainingsziel</span>
              <select name="goal" defaultValue={store.profile.goal}>
                <option>Muskelaufbau</option>
                <option>Kraftaufbau</option>
                <option>Fettabbau</option>
                <option>Allgemeine Fitness</option>
              </select>
            </label>
            <label>
              <span>Erfahrungsniveau</span>
              <select name="level" defaultValue={store.profile.level}>
                <option>Anfänger</option>
                <option>Fortgeschritten</option>
                <option>Profi</option>
              </select>
            </label>
            <label>
              <span>Trainingstage pro Woche</span>
              <input
                name="days"
                type="number"
                min="1"
                max="7"
                required
                defaultValue={store.profile.trainingDays}
              />
            </label>
            <label>
              <span>Einheiten</span>
              <input value="Kilogramm · Zentimeter" disabled />
            </label>
          </div>
          <button className="button button--primary">
            Änderungen speichern
          </button>
        </section>
        <section className="card share-settings">
          <h2>Was Freunde sehen dürfen</h2>
          <p className="share-settings__hint">
            Du entscheidest, welche Bereiche deine Freunde einsehen können.
            Nichts davon ist standardmäßig öffentlich.
          </p>
          <label className="share-toggle">
            <span>
              <strong>Training</strong>
              <small>Workouts, Volumen und persönliche Bestleistungen</small>
            </span>
            <input
              type="checkbox"
              checked={shareTraining}
              onChange={(event) => setShareTraining(event.target.checked)}
            />
          </label>
          <label className="share-toggle">
            <span>
              <strong>Gewicht</strong>
              <small>Dein Gewichtsverlauf</small>
            </span>
            <input
              type="checkbox"
              checked={shareWeight}
              onChange={(event) => setShareWeight(event.target.checked)}
            />
          </label>
          <label className="share-toggle">
            <span>
              <strong>Ernährung</strong>
              <small>Deine protokollierten Mahlzeiten</small>
            </span>
            <input
              type="checkbox"
              checked={shareNutrition}
              onChange={(event) => setShareNutrition(event.target.checked)}
            />
          </label>
        </section>
      </form>
      <section className="card danger-zone">
        <ShieldAlert />
        <div>
          <h2>Gefahrenzone</h2>
          <p>
            Das Löschen des Kontos entfernt alle persönlichen Fitnessdaten
            dauerhaft.
          </p>
        </div>
        <button
          className="button button--danger"
          onClick={() => setConfirm(true)}
        >
          Konto löschen
        </button>
      </section>
      <ConfirmDialog
        open={confirm}
        title="Konto endgültig löschen?"
        message="Alle Pläne, Workouts, Messwerte und Mahlzeiten werden unwiderruflich gelöscht."
        danger
        onCancel={() => setConfirm(false)}
        onConfirm={async () => {
          if (!demoMode && supabase) await supabase.rpc("delete_current_user");
          else localStorage.clear();
          await signOut();
          navigate("/fitness/register");
        }}
      />
    </div>
  );
}
