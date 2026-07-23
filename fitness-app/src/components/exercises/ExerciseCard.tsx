import { Copy, Heart, Pencil } from "lucide-react";
import type { Exercise } from "../../types";

export function ExerciseCard({
  exercise,
  onEdit,
  onDuplicate,
  onToggleFavorite,
}: {
  exercise: Exercise;
  onEdit: () => void;
  onDuplicate: () => void;
  onToggleFavorite: () => void;
}) {
  return (
    <article className="card exercise-card">
      <div className="exercise-card__media">
        {exercise.image ? (
          <img src={exercise.image} alt="" />
        ) : (
          <div className="exercise-card__placeholder">WLD</div>
        )}
        <button
          className={`favorite-button ${
            exercise.isFavorite ? "is-active" : ""
          }`}
          type="button"
          aria-label={
            exercise.isFavorite
              ? `${exercise.name} aus Favoriten entfernen`
              : `${exercise.name} zu Favoriten hinzufügen`
          }
          aria-pressed={Boolean(exercise.isFavorite)}
          onClick={onToggleFavorite}
        >
          <Heart fill={exercise.isFavorite ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="exercise-card__content">
        <span>
          {exercise.muscleGroup} · {exercise.equipment} ·{" "}
          {exercise.exerciseType}
        </span>
        <h3>{exercise.name}</h3>
        <p>{exercise.description}</p>
        <div className="exercise-card__badges">
          {!exercise.isPublic && <b className="custom-badge">Eigene Übung</b>}
          {exercise.isCustomized && (
            <b className="custom-badge">Personalisiert</b>
          )}
        </div>
        <details>
          <summary>Ausführungshinweise</summary>
          <ol>
            {exercise.instructions.map((instruction, index) => (
              <li key={index}>{instruction}</li>
            ))}
          </ol>
        </details>
        <div className="exercise-card__actions">
          <button
            type="button"
            onClick={onEdit}
            aria-label={`${exercise.name} bearbeiten`}
          >
            <Pencil /> Bearbeiten
          </button>
          <button
            type="button"
            onClick={onDuplicate}
            aria-label={`${exercise.name} kopieren`}
          >
            <Copy /> Kopieren
          </button>
        </div>
      </div>
    </article>
  );
}
