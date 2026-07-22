import { useState } from "react";
import { z } from "zod";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { AuthLayout } from "../components/Layout";

const emailSchema = z.string().email("Bitte eine gültige E-Mail eingeben.");
const passwordSchema = z.string().min(8, "Mindestens 8 Zeichen erforderlich.");
export function Login() {
  const { user, signIn, resetPassword, configured, demoMode } = useAuth();
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  if (user) return <Navigate to="/fitness" replace />;
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const d = new FormData(e.currentTarget);
    const email = String(d.get("email"));
    const valid = emailSchema.safeParse(email);
    if (!valid.success) {
      setError(valid.error.issues[0].message);
      return;
    }
    setLoading(true);
    if (forgot) {
      const problem = await resetPassword(email);
      if (problem) setError(problem);
      else
        setMessage(
          "Prüfe dein E-Mail-Postfach für den Wiederherstellungslink.",
        );
    } else {
      const problem = await signIn(email, String(d.get("password")));
      if (problem) setError(problem);
      else navigate("/fitness");
    }
    setLoading(false);
  };
  return (
    <AuthLayout>
      <form className="auth-form" onSubmit={submit}>
        <p>{forgot ? "PASSWORT ZURÜCKSETZEN" : "WILLKOMMEN ZURÜCK"}</p>
        <h2>{forgot ? "Zugang wiederherstellen" : "Einloggen"}</h2>
        <span>
          {forgot
            ? "Wir senden dir einen sicheren Link."
            : "Setze dein Training genau dort fort, wo du aufgehört hast."}
        </span>
        {!configured && !demoMode && (
          <div className="form-error">
            Supabase-Umgebungsvariablen fehlen. Siehe fitness-app/.env.example.
          </div>
        )}
        {error && <div className="form-error">{error}</div>}
        {message && <div className="form-success">{message}</div>}
        <label>
          <span>E-Mail</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="name@beispiel.ch"
          />
        </label>
        {!forgot && (
          <label>
            <span>Passwort</span>
            <div className="password">
              <input
                name="password"
                type={show ? "text" : "password"}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                aria-label="Passwort anzeigen"
              >
                {show ? <EyeOff /> : <Eye />}
              </button>
            </div>
          </label>
        )}
        <button className="button button--primary" disabled={loading}>
          {loading ? "Bitte warten…" : forgot ? "Link senden" : "Einloggen"}
        </button>
        <button
          className="text-button"
          type="button"
          onClick={() => {
            setForgot((v) => !v);
            setError("");
          }}
        >
          {forgot ? "Zurück zum Login" : "Passwort vergessen?"}
        </button>
        <small>
          Noch kein Konto?{" "}
          <Link to="/fitness/register">Jetzt registrieren</Link>
        </small>
      </form>
    </AuthLayout>
  );
}
export function Register() {
  const { user, signUp } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  if (user) return <Navigate to="/fitness" replace />;
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    const name = String(d.get("name")),
      email = String(d.get("email")),
      password = String(d.get("password"));
    const result = z
      .object({
        name: z.string().min(2),
        email: emailSchema,
        password: passwordSchema,
      })
      .safeParse({ name, email, password });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }
    setLoading(true);
    const problem = await signUp(email, password, name);
    setLoading(false);
    if (problem) setError(problem);
    else navigate("/fitness");
  };
  return (
    <AuthLayout>
      <form className="auth-form" onSubmit={submit}>
        <p>DEIN START</p>
        <h2>Konto erstellen</h2>
        <span>
          Plane Workouts und behalte deinen Fortschritt dauerhaft im Blick.
        </span>
        {error && <div className="form-error">{error}</div>}
        <label>
          <span>Anzeigename</span>
          <input name="name" autoComplete="name" required />
        </label>
        <label>
          <span>E-Mail</span>
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label>
          <span>Passwort</span>
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>
        <button className="button button--primary" disabled={loading}>
          {loading ? "Bitte warten…" : "Registrieren"}
        </button>
        <small>
          Bereits registriert? <Link to="/fitness/login">Zum Login</Link>
        </small>
      </form>
    </AuthLayout>
  );
}
