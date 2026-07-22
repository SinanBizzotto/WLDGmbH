import { useState } from "react";
import { LogOut, ShieldAlert, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useFitness } from "../data/FitnessContext";
import { supabase } from "../lib/supabase";
import { ConfirmDialog, useToast } from "../components/ui";

export default function Profile() {
  const { store, saveProfile } = useFitness();
  const { signOut, demoMode } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState(false);
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    await saveProfile({
      ...store.profile,
      displayName: String(d.get("name")),
      avatarUrl: String(d.get("avatar")) || undefined,
      heightCm: +String(d.get("height")),
      currentWeightKg: +String(d.get("currentWeight")),
      targetWeightKg: +String(d.get("targetWeight")),
      goal: String(d.get("goal")),
      level: String(d.get("level")),
      trainingDays: +String(d.get("days")),
    });
    toast("Profil gespeichert");
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
          <div className="profile-avatar">
            {store.profile.avatarUrl ? (
              <img src={store.profile.avatarUrl} alt="Profil" />
            ) : (
              <UserRound />
            )}
          </div>
          <h2>{store.profile.displayName || "Dein Profil"}</h2>
          <p>
            {store.profile.goal} · {store.profile.level}
          </p>
          <label>
            <span>Profilbild-URL</span>
            <input
              name="avatar"
              type="url"
              defaultValue={store.profile.avatarUrl}
            />
          </label>
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
