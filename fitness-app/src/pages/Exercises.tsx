import { useMemo, useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { useFitness } from "../data/FitnessContext";
import { useToast } from "../components/ui";
import type { EquipmentType, Exercise, MuscleGroup } from "../types";

const muscles: ("Alle" | MuscleGroup)[] = [
  "Alle",
  "Brust",
  "Rücken",
  "Beine",
  "Schulter",
  "Arme",
  "Bauch",
  "Ganzkörper",
];
const equipment: ("Alle" | EquipmentType)[] = [
  "Alle",
  "Körpergewicht",
  "Langhantel",
  "Kurzhantel",
  "Maschine",
  "Kabelzug",
  "Cardio",
];
export default function Exercises() {
  const { store, saveExercise } = useFitness();
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState<(typeof muscles)[number]>("Alle");
  const [device, setDevice] = useState<(typeof equipment)[number]>("Alle");
  const [create, setCreate] = useState(false);
  const filtered = useMemo(
    () =>
      store.exercises.filter(
        (e) =>
          (muscle === "Alle" || e.muscleGroup === muscle) &&
          (device === "Alle" || e.equipment === device) &&
          `${e.name} ${e.description}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [store.exercises, muscle, device, query],
  );
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const exercise: Exercise = {
      id: crypto.randomUUID(),
      userId: store.profile.id,
      name: String(data.get("name")),
      muscleGroup: String(data.get("muscle")) as MuscleGroup,
      equipment: String(data.get("equipment")) as EquipmentType,
      exerciseType: "Kraft",
      description: String(data.get("description")),
      instructions: String(data.get("instructions"))
        .split("\n")
        .filter(Boolean),
      isPublic: false,
    };
    await saveExercise(exercise);
    setCreate(false);
    toast("Eigene Übung erstellt");
  };
  return (
    <div className="stack-page">
      <div className="page-title">
        <div>
          <p>ÜBUNGSBIBLIOTHEK</p>
          <h2>Übungen entdecken</h2>
        </div>
        <button
          className="button button--primary"
          onClick={() => setCreate(true)}
        >
          <Plus /> Eigene Übung
        </button>
      </div>
      <div className="exercise-filters">
        <label>
          <Search />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Übung suchen"
          />
        </label>
        <select
          value={muscle}
          onChange={(e) => setMuscle(e.target.value as typeof muscle)}
        >
          {muscles.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <select
          value={device}
          onChange={(e) => setDevice(e.target.value as typeof device)}
        >
          {equipment.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </div>
      <div className="exercise-grid">
        {filtered.map((ex) => (
          <article className="card exercise-card" key={ex.id}>
            {ex.image ? (
              <img src={ex.image} alt={ex.name} />
            ) : (
              <div className="exercise-card__placeholder">WLD</div>
            )}
            <div>
              <span>
                {ex.muscleGroup} · {ex.equipment}
              </span>
              <h3>{ex.name}</h3>
              <p>{ex.description}</p>
              <details>
                <summary>Ausführungshinweise</summary>
                <ol>
                  {ex.instructions.map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ol>
              </details>
              {!ex.isPublic && <b className="custom-badge">Eigene Übung</b>}
            </div>
          </article>
        ))}
      </div>
      {create && (
        <div className="modal">
          <form className="dialog form-dialog" onSubmit={submit}>
            <button
              type="button"
              className="dialog-close"
              onClick={() => setCreate(false)}
            >
              <X />
            </button>
            <h2>Eigene Übung</h2>
            <label>
              <span>Name</span>
              <input name="name" required minLength={2} />
            </label>
            <div className="form-grid">
              <label>
                <span>Muskelgruppe</span>
                <select name="muscle">
                  {muscles.slice(1).map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Geräteart</span>
                <select name="equipment">
                  {equipment.slice(1).map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              <span>Beschreibung</span>
              <textarea name="description" required />
            </label>
            <label>
              <span>Ausführungshinweise (eine Zeile je Schritt)</span>
              <textarea name="instructions" required />
            </label>
            <button className="button button--primary">Übung speichern</button>
          </form>
        </div>
      )}
    </div>
  );
}
