import { useState } from "react";
import { X } from "lucide-react";
import { ImagePicker } from "../ImagePicker";
import type { EquipmentType, Exercise, MuscleGroup } from "../../types";

const exerciseTypes: Exercise["exerciseType"][] = [
  "Kraft",
  "Cardio",
  "Mobilität",
];

export function ExerciseEditor({
  exercise,
  muscles,
  equipment,
  userId,
  onSubmit,
  onClose,
}: {
  exercise: Exercise | null;
  muscles: MuscleGroup[];
  equipment: EquipmentType[];
  userId: string;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}) {
  const [image, setImage] = useState(exercise?.image);
  return (
    <div
      className="modal"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form
        key={exercise?.id ?? "new-exercise"}
        className="dialog form-dialog exercise-editor"
        onSubmit={onSubmit}
      >
        <button
          type="button"
          className="dialog-close"
          aria-label="Dialog schließen"
          onClick={onClose}
        >
          <X />
        </button>
        <div>
          <p className="dialog-kicker">
            {exercise?.isPublic
              ? "PERSÖNLICHE ANPASSUNG"
              : exercise
                ? "EIGENE ÜBUNG"
                : "NEUE ÜBUNG"}
          </p>
          <h2>{exercise ? "Übung bearbeiten" : "Eigene Übung erstellen"}</h2>
          {exercise?.isPublic && (
            <p className="dialog-hint">
              Deine Änderungen gelten nur für dein Konto. Die öffentliche
              Originalübung bleibt unverändert.
            </p>
          )}
        </div>
        <input type="hidden" name="image" value={image ?? ""} />
        <div className="field-group">
          <span className="field-group__label">
            Foto vom Gerät (aufnehmen oder aus Fotos wählen)
          </span>
          <ImagePicker
            bucket="exercise-images"
            userId={userId}
            value={image}
            onChange={setImage}
            label={image ? "Foto ändern" : "Foto hinzufügen"}
            shape="square"
          />
        </div>
        <label>
          <span>Name nach Wunsch</span>
          <input
            name="name"
            required
            minLength={2}
            maxLength={80}
            defaultValue={exercise?.name}
            autoFocus
          />
        </label>
        <div className="form-grid">
          <label>
            <span>Muskelgruppe</span>
            <select name="muscle" defaultValue={exercise?.muscleGroup}>
              {muscles.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Geräteart</span>
            <select name="equipment" defaultValue={exercise?.equipment}>
              {equipment.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Übungstyp</span>
            <select
              name="exerciseType"
              defaultValue={exercise?.exerciseType ?? "Kraft"}
            >
              {exerciseTypes.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
        </div>
        <label>
          <span>Beschreibung</span>
          <textarea
            name="description"
            required
            maxLength={500}
            defaultValue={exercise?.description}
          />
        </label>
        <label>
          <span>Ausführungshinweise – eine Zeile je Schritt</span>
          <textarea
            name="instructions"
            required
            defaultValue={exercise?.instructions.join("\n")}
          />
        </label>
        <button className="button button--primary">
          {exercise ? "Änderungen speichern" : "Übung speichern"}
        </button>
      </form>
    </div>
  );
}
