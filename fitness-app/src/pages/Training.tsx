import { useEffect, useRef, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Clock3,
  Dumbbell,
  History,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { useFitness } from "../data/FitnessContext";
import { ConfirmDialog, EmptyState, useToast } from "../components/ui";
import type {
  PlanExercise,
  WorkoutPlan,
  WorkoutSession,
  WorkoutSet,
} from "../types";

const id = () => crypto.randomUUID();
export function TrainingPlans() {
  const { store, deletePlan } = useFitness();
  const [remove, setRemove] = useState<string | null>(null);
  const toast = useToast();
  return (
    <div className="stack-page">
      <div className="page-title">
        <div>
          <p>TRAININGSBEREICH</p>
          <h2>Deine Trainingspläne</h2>
        </div>
        <Link className="button button--primary" to="/fitness/training/new">
          <Plus /> Neuer Plan
        </Link>
      </div>
      {store.plans.length === 0 ? (
        <EmptyState
          title="Noch kein Trainingsplan"
          text="Stelle Übungen, Sätze und Pausenzeiten für dein erstes Workout zusammen."
          action={
            <Link className="button button--primary" to="/fitness/training/new">
              Plan erstellen
            </Link>
          }
        />
      ) : (
        <div className="plan-grid">
          {store.plans.map((plan) => (
            <article className="card plan-card" key={plan.id}>
              <div>
                <span>{plan.muscleGroups.join(" · ")}</span>
                <h3>{plan.name}</h3>
                <p>
                  <Dumbbell /> {plan.exercises.length} Übungen <Clock3 /> ca.{" "}
                  {plan.estimatedMinutes} Min.
                </p>
              </div>
              <div className="plan-card__actions">
                <Link
                  className="button button--primary"
                  to={`/fitness/training/${plan.id}`}
                >
                  Starten
                </Link>
                <Link
                  className="button button--secondary"
                  to={`/fitness/training/new?edit=${plan.id}`}
                >
                  Bearbeiten
                </Link>
                <button
                  className="icon-button danger"
                  onClick={() => setRemove(plan.id)}
                  aria-label="Plan löschen"
                >
                  <Trash2 />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
      <section className="card history">
        <h2>
          <History /> Vergangene Workouts
        </h2>
        {store.sessions
          .filter((s) => s.status === "completed")
          .slice(0, 8)
          .map((s) => (
            <div key={s.id}>
              <span>
                <strong>{s.planName}</strong>
                <small>
                  {new Date(s.startedAt).toLocaleDateString("de-CH")}
                </small>
              </span>
              <span>{Math.round(s.durationSeconds / 60)} Min.</span>
              <b>{s.totalVolumeKg.toLocaleString("de-CH")} kg</b>
            </div>
          ))}
      </section>
      <ConfirmDialog
        open={Boolean(remove)}
        title="Trainingsplan löschen?"
        message="Der Plan wird dauerhaft entfernt. Vergangene Workouts bleiben erhalten."
        danger
        onCancel={() => setRemove(null)}
        onConfirm={async () => {
          if (remove) await deletePlan(remove);
          setRemove(null);
          toast("Plan gelöscht");
        }}
      />
    </div>
  );
}

const schema = z.object({
  name: z.string().min(2, "Bitte einen Namen eingeben."),
  estimatedMinutes: z.number().min(5).max(300),
});
type Form = z.infer<typeof schema>;
export function WorkoutPlanForm() {
  const { store, savePlan } = useFitness();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const existing = store.plans.find((p) => p.id === params.get("edit"));
  const [selected, setSelected] = useState<PlanExercise[]>(
    existing?.exercises ?? [],
  );
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: existing?.name ?? "",
      estimatedMinutes: existing?.estimatedMinutes ?? 50,
    },
  });
  const add = (exerciseId: string) =>
    setSelected((s) =>
      s.some((x) => x.exerciseId === exerciseId)
        ? s
        : [
            ...s,
            {
              id: id(),
              exerciseId,
              order: s.length,
              sets: 3,
              reps: 10,
              weightKg: 0,
              restSeconds: 60,
            },
          ],
    );
  const change = (
    peId: string,
    field: keyof Pick<
      PlanExercise,
      "sets" | "reps" | "weightKg" | "restSeconds"
    >,
    value: number,
  ) =>
    setSelected((s) =>
      s.map((x) => (x.id === peId ? { ...x, [field]: value } : x)),
    );
  const move = (index: number, dir: -1 | 1) =>
    setSelected((s) => {
      const next = [...s],
        target = index + dir;
      if (target < 0 || target >= next.length) return s;
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((x, i) => ({ ...x, order: i }));
    });
  const submit = async (form: Form) => {
    const muscleGroups = [
      ...new Set(
        selected
          .map(
            (pe) =>
              store.exercises.find((e) => e.id === pe.exerciseId)?.muscleGroup,
          )
          .filter(Boolean),
      ),
    ] as WorkoutPlan["muscleGroups"];
    await savePlan({
      id: existing?.id ?? id(),
      name: form.name,
      estimatedMinutes: form.estimatedMinutes,
      muscleGroups,
      updatedAt: new Date().toISOString(),
      exercises: selected,
    });
    toast("Trainingsplan gespeichert");
    navigate("/fitness/training");
  };
  return (
    <div className="stack-page">
      <div className="page-title">
        <div>
          <p>PLAN BUILDER</p>
          <h2>{existing ? "Plan bearbeiten" : "Neuer Trainingsplan"}</h2>
        </div>
      </div>
      <form className="builder" onSubmit={handleSubmit(submit)}>
        <section className="card form-card">
          <div className="form-grid">
            <label>
              <span>Planname</span>
              <input {...register("name")} placeholder="z. B. Pull Day" />
              {errors.name && (
                <small className="field-error">{errors.name.message}</small>
              )}
            </label>
            <label>
              <span>Geschätzte Dauer (Min.)</span>
              <input
                type="number"
                {...register("estimatedMinutes", { valueAsNumber: true })}
              />
            </label>
          </div>
        </section>
        <section className="card">
          <div className="card__head">
            <div>
              <h2>Übungen</h2>
              <p>Wähle Übungen aus der Bibliothek.</p>
            </div>
            <b>{selected.length} gewählt</b>
          </div>
          <div className="picker">
            {store.exercises.map((ex) => (
              <button
                type="button"
                className={
                  selected.some((x) => x.exerciseId === ex.id) ? "selected" : ""
                }
                key={ex.id}
                onClick={() => add(ex.id)}
              >
                <span>
                  {ex.image && <img src={ex.image} alt="" />}
                  <b>{ex.name}</b>
                  <small>
                    {ex.muscleGroup} · {ex.equipment}
                  </small>
                </span>
                {selected.some((x) => x.exerciseId === ex.id) ? (
                  <Check />
                ) : (
                  <Plus />
                )}
              </button>
            ))}
          </div>
        </section>
        {selected.length > 0 && (
          <section className="card">
            <h2>Reihenfolge & Vorgaben</h2>
            <div className="selected-exercises">
              {selected.map((pe, index) => {
                const ex = store.exercises.find((e) => e.id === pe.exerciseId);
                return (
                  <div key={pe.id}>
                    <div className="order">
                      <b>{index + 1}</b>
                      <span>
                        <strong>{ex?.name}</strong>
                        <small>{ex?.muscleGroup}</small>
                      </span>
                      <button
                        type="button"
                        onClick={() => move(index, -1)}
                        aria-label="Nach oben"
                      >
                        <ChevronUp />
                      </button>
                      <button
                        type="button"
                        onClick={() => move(index, 1)}
                        aria-label="Nach unten"
                      >
                        <ChevronDown />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setSelected((s) => s.filter((x) => x.id !== pe.id))
                        }
                        aria-label="Entfernen"
                      >
                        <Trash2 />
                      </button>
                    </div>
                    <div className="set-config">
                      <label>
                        Sätze
                        <input
                          type="number"
                          min="1"
                          value={pe.sets}
                          onChange={(e) =>
                            change(pe.id, "sets", +e.target.value)
                          }
                        />
                      </label>
                      <label>
                        Wdh.
                        <input
                          type="number"
                          min="1"
                          value={pe.reps}
                          onChange={(e) =>
                            change(pe.id, "reps", +e.target.value)
                          }
                        />
                      </label>
                      <label>
                        Gewicht kg
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={pe.weightKg}
                          onChange={(e) =>
                            change(pe.id, "weightKg", +e.target.value)
                          }
                        />
                      </label>
                      <label>
                        Pause Sek.
                        <input
                          type="number"
                          min="0"
                          step="5"
                          value={pe.restSeconds}
                          onChange={(e) =>
                            change(pe.id, "restSeconds", +e.target.value)
                          }
                        />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
        <div className="sticky-submit">
          <button
            type="button"
            className="button button--secondary"
            onClick={() => navigate(-1)}
          >
            Abbrechen
          </button>
          <button
            className="button button--primary"
            disabled={!selected.length}
          >
            Plan speichern
          </button>
        </div>
      </form>
    </div>
  );
}

function buildSession(plan: WorkoutPlan): WorkoutSession {
  return {
    id: id(),
    planId: plan.id,
    planName: plan.name,
    status: "active",
    startedAt: new Date().toISOString(),
    durationSeconds: 0,
    totalVolumeKg: 0,
    currentExerciseIndex: 0,
    sets: plan.exercises.flatMap((pe) =>
      Array.from({ length: pe.sets }, (_, i) => ({
        id: id(),
        exerciseId: pe.exerciseId,
        setNumber: i + 1,
        plannedReps: pe.reps,
        actualReps: pe.reps,
        weightKg: pe.weightKg,
        completed: false,
      })),
    ),
  };
}
export function ActiveWorkout() {
  const { workoutId } = useParams();
  const { store, saveSession } = useFitness();
  const navigate = useNavigate();
  const toast = useToast();
  const active = store.sessions.find(
    (s) => s.id === workoutId && s.status === "active",
  );
  const plan = store.plans.find((p) => p.id === (active?.planId ?? workoutId));
  const [session, setSession] = useState<WorkoutSession | null>(
    () => active ?? (plan ? buildSession(plan) : null),
  );
  const [rest, setRest] = useState(0);
  const [running, setRunning] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const initialized = useRef(false);
  useEffect(() => {
    if (!initialized.current && session) {
      initialized.current = true;
      void saveSession(session);
    }
  }, [session, saveSession]);
  useEffect(() => {
    if (!running || rest <= 0) return;
    const timer = window.setInterval(
      () =>
        setRest((v) => {
          if (v <= 1) {
            setRunning(false);
            return 0;
          }
          return v - 1;
        }),
      1000,
    );
    return () => clearInterval(timer);
  }, [running, rest]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (session?.status === "active") {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    addEventListener("beforeunload", warn);
    return () => removeEventListener("beforeunload", warn);
  }, [session?.status]);
  if (!session || !plan)
    return (
      <EmptyState
        title="Workout nicht gefunden"
        text="Der Trainingsplan existiert nicht mehr."
        action={
          <Link className="button button--primary" to="/fitness/training">
            Zu den Plänen
          </Link>
        }
      />
    );
  const planExercise = plan.exercises[session.currentExerciseIndex];
  const exercise = store.exercises.find(
    (e) => e.id === planExercise?.exerciseId,
  );
  const exerciseSets = session.sets.filter(
    (s) => s.exerciseId === exercise?.id,
  );
  const previousSets = store.sessions
    .filter((item) => item.status === "completed" && item.id !== session.id)
    .flatMap((item) => item.sets)
    .filter((set) => set.exerciseId === exercise?.id);
  const completed = session.sets.filter((s) => s.completed).length;
  const updateSet = (setId: string, patch: Partial<WorkoutSet>) =>
    setSession((s) =>
      s
        ? {
            ...s,
            sets: s.sets.map((x) => (x.id === setId ? { ...x, ...patch } : x)),
          }
        : s,
    );
  const toggle = async (set: WorkoutSet) => {
    const next = { ...set, completed: !set.completed };
    updateSet(set.id, next);
    if (next.completed) {
      setRest(planExercise.restSeconds);
      setRunning(true);
      navigator.vibrate?.(25);
    }
    window.setTimeout(() => {
      setSession((current) => {
        if (current) void saveSession(current);
        return current;
      });
    }, 0);
  };
  const skip = () =>
    setSession((s) =>
      s
        ? {
            ...s,
            currentExerciseIndex: Math.min(
              plan.exercises.length - 1,
              s.currentExerciseIndex + 1,
            ),
          }
        : s,
    );
  const finish = async () => {
    const duration = Math.round(
      (Date.now() - new Date(session.startedAt).getTime()) / 1000,
    );
    const totalVolumeKg = session.sets
      .filter((s) => s.completed)
      .reduce((n, s) => n + s.actualReps * s.weightKg, 0);
    await saveSession({
      ...session,
      status: "completed",
      completedAt: new Date().toISOString(),
      durationSeconds: duration,
      totalVolumeKg,
    });
    toast("Workout abgeschlossen – starke Leistung!");
    navigate("/fitness/progress");
  };
  return (
    <div className="active-workout">
      <header>
        <button onClick={() => setConfirm(true)}>✕</button>
        <div>
          <small>{plan.name}</small>
          <strong>
            {completed} / {session.sets.length} Sätze
          </strong>
        </div>
        <div className="workout-progress">
          <i style={{ width: `${(completed / session.sets.length) * 100}%` }} />
        </div>
      </header>
      <main>
        <section className="current-exercise">
          <span>
            ÜBUNG {session.currentExerciseIndex + 1} VON {plan.exercises.length}
          </span>
          <h1>{exercise?.name}</h1>
          <p>
            {exercise?.muscleGroup} · {exercise?.equipment}
          </p>
          {exercise?.image && <img src={exercise.image} alt={exercise.name} />}
        </section>
        <section className="active-sets">
          <div className="set-row set-row--head">
            <span>Satz</span>
            <span>Vorher</span>
            <span>kg</span>
            <span>Wdh.</span>
            <span></span>
          </div>
          {exerciseSets.map((set) => (
            <div
              className={`set-row ${set.completed ? "completed" : ""}`}
              key={set.id}
            >
              <b>{set.setNumber}</b>
              <span>
                {(() => {
                  const previous = previousSets.find(
                    (item) => item.setNumber === set.setNumber,
                  );
                  return previous
                    ? `${previous.weightKg} × ${previous.actualReps}`
                    : "—";
                })()}
              </span>
              <input
                aria-label={`Gewicht Satz ${set.setNumber}`}
                type="number"
                step="0.5"
                value={set.weightKg}
                onChange={(e) =>
                  updateSet(set.id, { weightKg: +e.target.value })
                }
              />
              <input
                aria-label={`Wiederholungen Satz ${set.setNumber}`}
                type="number"
                value={set.actualReps}
                onChange={(e) =>
                  updateSet(set.id, { actualReps: +e.target.value })
                }
              />
              <button
                onClick={() => toggle(set)}
                aria-label={`Satz ${set.setNumber} ${set.completed ? "öffnen" : "abschließen"}`}
              >
                <Check />
              </button>
            </div>
          ))}
        </section>
        <section className="rest-timer">
          <div>
            <small>PAUSENTIMER</small>
            <strong>
              {String(Math.floor(rest / 60)).padStart(2, "0")}:
              {String(rest % 60).padStart(2, "0")}
            </strong>
          </div>
          <button onClick={() => setRunning((v) => !v)}>
            {running ? <Pause /> : <Play />}
          </button>
          <button
            onClick={() => {
              setRest(planExercise.restSeconds);
              setRunning(false);
            }}
          >
            <RotateCcw />
          </button>
          <button onClick={() => setRest((v) => v + 30)}>+30</button>
        </section>
        <div className="workout-actions">
          <button className="button button--secondary" onClick={skip}>
            Übung überspringen
          </button>
          {session.currentExerciseIndex < plan.exercises.length - 1 ? (
            <button className="button button--primary" onClick={skip}>
              Nächste Übung →
            </button>
          ) : (
            <button className="button button--primary" onClick={finish}>
              Workout abschließen
            </button>
          )}
        </div>
      </main>
      <ConfirmDialog
        open={confirm}
        title="Workout verlassen?"
        message="Dein aktueller Stand wird gespeichert. Du kannst das Workout später fortsetzen."
        onCancel={() => setConfirm(false)}
        onConfirm={async () => {
          await saveSession(session);
          navigate("/fitness/training");
        }}
      />
    </div>
  );
}
