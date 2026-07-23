import { useMemo, useState } from "react";
import {
  Heart,
  Plus,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useFitness } from "../data/FitnessContext";
import { EmptyState, useToast } from "../components/ui";
import { ExerciseCard } from "../components/exercises/ExerciseCard";
import { ExerciseEditor } from "../components/exercises/ExerciseEditor";
import type { EquipmentType, Exercise, MuscleGroup } from "../types";

const muscleOptions: MuscleGroup[] = [
  "Brust",
  "Rücken",
  "Beine",
  "Schulter",
  "Arme",
  "Bauch",
  "Ganzkörper",
];
const muscles: ("Alle" | MuscleGroup)[] = ["Alle", ...muscleOptions];
const equipmentOptions: EquipmentType[] = [
  "Körpergewicht",
  "Langhantel",
  "Kurzhantel",
  "Maschine",
  "Kabelzug",
  "Cardio",
];
const equipment: ("Alle" | EquipmentType)[] = ["Alle", ...equipmentOptions];
type SortOrder = "name" | "muscle" | "favorites";

export default function Exercises() {
  const {
    store,
    saveExercise,
    toggleFavoriteExercise,
    duplicateExercise,
  } = useFitness();
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState<(typeof muscles)[number]>("Alle");
  const [device, setDevice] = useState<(typeof equipment)[number]>("Alle");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sort, setSort] = useState<SortOrder>("name");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Exercise | null>(null);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return store.exercises
      .filter(
        (exercise) =>
          (muscle === "Alle" || exercise.muscleGroup === muscle) &&
          (device === "Alle" || exercise.equipment === device) &&
          (!favoritesOnly || exercise.isFavorite) &&
          (!search ||
            `${exercise.name} ${exercise.description} ${exercise.muscleGroup} ${exercise.equipment}`
              .toLowerCase()
              .includes(search)),
      )
      .sort((a, b) => {
        if (sort === "favorites") {
          return (
            Number(Boolean(b.isFavorite)) - Number(Boolean(a.isFavorite)) ||
            a.name.localeCompare(b.name, "de")
          );
        }
        if (sort === "muscle") {
          return (
            a.muscleGroup.localeCompare(b.muscleGroup, "de") ||
            a.name.localeCompare(b.name, "de")
          );
        }
        return a.name.localeCompare(b.name, "de");
      });
  }, [store.exercises, muscle, device, favoritesOnly, query, sort]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (exercise: Exercise) => {
    setEditing(exercise);
    setFormOpen(true);
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const exercise: Exercise = {
      id: editing?.id ?? crypto.randomUUID(),
      userId: editing?.userId ?? store.profile.id,
      name: String(data.get("name")).trim(),
      muscleGroup: String(data.get("muscle")) as MuscleGroup,
      equipment: String(data.get("equipment")) as EquipmentType,
      exerciseType: String(data.get("exerciseType")) as Exercise["exerciseType"],
      description: String(data.get("description")).trim(),
      instructions: String(data.get("instructions"))
        .split("\n")
        .map((instruction) => instruction.trim())
        .filter(Boolean),
      image: editing?.image,
      isPublic: editing?.isPublic ?? false,
      isFavorite: editing?.isFavorite ?? false,
      isCustomized: editing?.isCustomized,
    };
    try {
      await saveExercise(exercise);
      setFormOpen(false);
      setEditing(null);
      toast(editing ? "Übung aktualisiert" : "Eigene Übung erstellt");
    } catch {
      toast("Übung konnte nicht gespeichert werden", "error");
    }
  };

  const toggleFavorite = async (exercise: Exercise) => {
    try {
      await toggleFavoriteExercise(exercise.id);
      toast(
        exercise.isFavorite
          ? "Aus Favoriten entfernt"
          : "Zu Favoriten hinzugefügt",
      );
    } catch {
      toast("Favorit konnte nicht gespeichert werden", "error");
    }
  };

  const duplicate = async (exercise: Exercise) => {
    try {
      const copy = await duplicateExercise(exercise);
      toast("Persönliche Kopie erstellt");
      openEdit(copy);
    } catch {
      toast("Übung konnte nicht kopiert werden", "error");
    }
  };

  const favoriteCount = store.exercises.filter(
    (exercise) => exercise.isFavorite,
  ).length;
  const customCount = store.exercises.filter(
    (exercise) => !exercise.isPublic || exercise.isCustomized,
  ).length;

  return (
    <div className="stack-page">
      <div className="page-title">
        <div>
          <p>ÜBUNGSBIBLIOTHEK</p>
          <h2>Übungen entdecken</h2>
        </div>
        <button className="button button--primary" onClick={openCreate}>
          <Plus /> Eigene Übung
        </button>
      </div>

      <div className="exercise-overview" aria-label="Bibliothek-Übersicht">
        <div>
          <strong>{store.exercises.length}</strong>
          <span>Übungen</span>
        </div>
        <div>
          <strong>{favoriteCount}</strong>
          <span>Favoriten</span>
        </div>
        <div>
          <strong>{customCount}</strong>
          <span>Personalisiert</span>
        </div>
      </div>

      <div className="exercise-filters">
        <label className="exercise-search">
          <Search />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name, Muskel oder Gerät suchen"
          />
        </label>
        <select
          aria-label="Muskelgruppe filtern"
          value={muscle}
          onChange={(event) =>
            setMuscle(event.target.value as typeof muscle)
          }
        >
          {muscles.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select
          aria-label="Geräteart filtern"
          value={device}
          onChange={(event) =>
            setDevice(event.target.value as typeof device)
          }
        >
          {equipment.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select
          aria-label="Übungen sortieren"
          value={sort}
          onChange={(event) => setSort(event.target.value as SortOrder)}
        >
          <option value="name">A–Z sortieren</option>
          <option value="muscle">Nach Muskelgruppe</option>
          <option value="favorites">Favoriten zuerst</option>
        </select>
        <button
          className={`favorite-filter ${favoritesOnly ? "is-active" : ""}`}
          type="button"
          aria-pressed={favoritesOnly}
          onClick={() => setFavoritesOnly((current) => !current)}
        >
          <Heart fill={favoritesOnly ? "currentColor" : "none"} />
          Nur Favoriten
        </button>
      </div>

      <div className="exercise-result-row">
        <span>
          <SlidersHorizontal /> {filtered.length} Ergebnisse
        </span>
        {(query ||
          muscle !== "Alle" ||
          device !== "Alle" ||
          favoritesOnly) && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setMuscle("Alle");
              setDevice("Alle");
              setFavoritesOnly(false);
            }}
          >
            Filter zurücksetzen
          </button>
        )}
      </div>

      {filtered.length ? (
        <div className="exercise-grid">
          {filtered.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              onEdit={() => openEdit(exercise)}
              onDuplicate={() => void duplicate(exercise)}
              onToggleFavorite={() => void toggleFavorite(exercise)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Keine Übungen gefunden"
          text="Passe deine Suche oder Filter an, oder erstelle eine eigene Übung."
          action={
            <button className="button button--primary" onClick={openCreate}>
              <Plus /> Eigene Übung
            </button>
          }
        />
      )}

      {formOpen && (
        <ExerciseEditor
          exercise={editing}
          muscles={muscleOptions}
          equipment={equipmentOptions}
          onSubmit={submit}
          onClose={() => setFormOpen(false)}
        />
      )}
    </div>
  );
}
