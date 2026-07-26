import { useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Dumbbell,
  Scale,
  Trophy,
  UserPlus,
  Users,
  UserX,
} from "lucide-react";
import { useFitness } from "../data/FitnessContext";
import { EmptyState, useToast } from "../components/ui";
import type { FriendConnection, FriendStats } from "../types";

function FriendAvatar({ friend }: { friend: FriendConnection }) {
  return friend.friendAvatarUrl ? (
    <img className="friend-avatar" src={friend.friendAvatarUrl} alt="" />
  ) : (
    <div className="friend-avatar friend-avatar--placeholder">
      {friend.friendDisplayName.slice(0, 1).toUpperCase()}
    </div>
  );
}

function FriendStatsPanel({ stats }: { stats: FriendStats }) {
  if (!stats.sharesTraining && !stats.sharesWeight && !stats.sharesNutrition) {
    return (
      <p className="friend-stats__empty">
        Diese Person teilt aktuell keine Fortschritte.
      </p>
    );
  }
  return (
    <div className="friend-stats">
      {stats.sharesTraining && (
        <div className="friend-stats__group">
          <h4>
            <Dumbbell size={16} /> Training
          </h4>
          <div className="friend-stats__row">
            <div>
              <strong>{stats.workoutCount}</strong>
              <span>Workouts</span>
            </div>
            <div>
              <strong>{Math.round(stats.totalVolumeKg).toLocaleString("de-CH")}</strong>
              <span>kg Gesamtvolumen</span>
            </div>
          </div>
          {stats.personalRecords.length > 0 && (
            <ul className="friend-stats__records">
              {stats.personalRecords.map((record) => (
                <li key={record.id}>
                  <Trophy size={14} />
                  {record.exerciseName} · {record.weightKg} kg
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {stats.sharesWeight && (
        <div className="friend-stats__group">
          <h4>
            <Scale size={16} /> Gewicht
          </h4>
          {stats.weightSeries.length > 0 ? (
            <p>
              Aktuell {stats.weightSeries[stats.weightSeries.length - 1].kg} kg
              {stats.weightSeries.length > 1 &&
                ` (Start ${stats.weightSeries[0].kg} kg)`}
            </p>
          ) : (
            <p>Noch keine Messwerte.</p>
          )}
        </div>
      )}
      {stats.sharesNutrition && (
        <div className="friend-stats__group">
          <h4>Ernährung</h4>
          <p>
            {stats.avgDailyCalories
              ? `Ø ${stats.avgDailyCalories} kcal pro Mahlzeit`
              : "Noch keine Mahlzeiten protokolliert."}
          </p>
        </div>
      )}
    </div>
  );
}

export default function Friends() {
  const { store, sendFriendRequest, respondToFriendRequest, removeFriend, loadFriendStats } =
    useFitness();
  const toast = useToast();
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [statsCache, setStatsCache] = useState<Record<string, FriendStats>>({});
  const [statsLoading, setStatsLoading] = useState<string | null>(null);

  const accepted = store.friends.filter((f) => f.status === "accepted");
  const incoming = store.friends.filter(
    (f) => f.status === "pending" && f.direction === "incoming",
  );
  const outgoing = store.friends.filter(
    (f) => f.status === "pending" && f.direction === "outgoing",
  );

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const name = await sendFriendRequest(code);
      toast(`Anfrage an ${name} gesendet`);
      setCode("");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Fehler", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleExpand = async (friend: FriendConnection) => {
    if (expanded === friend.id) {
      setExpanded(null);
      return;
    }
    setExpanded(friend.id);
    if (!statsCache[friend.friendId]) {
      setStatsLoading(friend.friendId);
      try {
        const stats = await loadFriendStats(friend.friendId);
        setStatsCache((current) => ({ ...current, [friend.friendId]: stats }));
      } catch {
        toast("Fortschritt konnte nicht geladen werden", "error");
      } finally {
        setStatsLoading(null);
      }
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(store.profile.friendCode);
      toast("Code kopiert");
    } catch {
      toast("Kopieren fehlgeschlagen", "error");
    }
  };

  return (
    <div className="stack-page">
      <div className="page-title">
        <div>
          <p>COMMUNITY</p>
          <h2>Freunde</h2>
        </div>
      </div>

      <section className="card friend-code-card">
        <div>
          <p className="friend-code-card__label">Dein Freundescode</p>
          <strong className="friend-code-card__code">
            {store.profile.friendCode || "…"}
          </strong>
          <p className="friend-code-card__hint">
            Teile diesen Code, damit dich andere hinzufügen können. Nur wer
            deinen Code kennt, findet dein Profil.
          </p>
        </div>
        <button
          type="button"
          className="button button--secondary"
          onClick={copyCode}
        >
          <Copy /> Kopieren
        </button>
      </section>

      <section className="card">
        <h2>Freund hinzufügen</h2>
        <form className="friend-add-form" onSubmit={submit}>
          <input
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="Code eingeben, z. B. AB12CD34"
            maxLength={16}
            required
          />
          <button
            className="button button--primary"
            type="submit"
            disabled={submitting}
          >
            <UserPlus /> Hinzufügen
          </button>
        </form>
      </section>

      {incoming.length > 0 && (
        <section className="card">
          <h2>Anfragen</h2>
          <ul className="friend-request-list">
            {incoming.map((friend) => (
              <li key={friend.id}>
                <FriendAvatar friend={friend} />
                <span>{friend.friendDisplayName}</span>
                <div className="friend-request-list__actions">
                  <button
                    type="button"
                    className="icon-button"
                    aria-label="Annehmen"
                    onClick={() =>
                      respondToFriendRequest(friend.id, true)
                        .then(() =>
                          toast(`${friend.friendDisplayName} ist jetzt dein Freund`),
                        )
                        .catch(() =>
                          toast("Anfrage konnte nicht angenommen werden", "error"),
                        )
                    }
                  >
                    <Check />
                  </button>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label="Ablehnen"
                    onClick={() =>
                      respondToFriendRequest(friend.id, false)
                        .then(() => toast("Anfrage abgelehnt"))
                        .catch(() =>
                          toast("Anfrage konnte nicht abgelehnt werden", "error"),
                        )
                    }
                  >
                    <UserX />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {outgoing.length > 0 && (
        <section className="card">
          <h2>Ausstehend</h2>
          <ul className="friend-request-list">
            {outgoing.map((friend) => (
              <li key={friend.id}>
                <FriendAvatar friend={friend} />
                <span>{friend.friendDisplayName}</span>
                <div className="friend-request-list__actions">
                  <button
                    type="button"
                    className="icon-button"
                    aria-label="Anfrage zurückziehen"
                    onClick={() =>
                      removeFriend(friend.id)
                        .then(() => toast("Anfrage zurückgezogen"))
                        .catch(() =>
                          toast("Anfrage konnte nicht zurückgezogen werden", "error"),
                        )
                    }
                  >
                    <UserX />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card">
        <h2>Deine Freunde</h2>
        {accepted.length ? (
          <ul className="friend-list">
            {accepted.map((friend) => (
              <li key={friend.id} className="friend-list__item">
                <button
                  type="button"
                  className="friend-list__header"
                  onClick={() => void toggleExpand(friend)}
                >
                  <FriendAvatar friend={friend} />
                  <span>{friend.friendDisplayName}</span>
                  {expanded === friend.id ? <ChevronUp /> : <ChevronDown />}
                </button>
                {expanded === friend.id && (
                  <div className="friend-list__details">
                    {statsLoading === friend.friendId ? (
                      <p>Lädt Fortschritt …</p>
                    ) : statsCache[friend.friendId] ? (
                      <FriendStatsPanel stats={statsCache[friend.friendId]} />
                    ) : null}
                    <button
                      type="button"
                      className="button button--secondary friend-list__remove"
                      onClick={() =>
                        removeFriend(friend.id)
                          .then(() => toast("Freund entfernt"))
                          .catch(() =>
                            toast("Freund konnte nicht entfernt werden", "error"),
                          )
                      }
                    >
                      <UserX /> Freund entfernen
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="Noch keine Freunde"
            text="Teile deinen Code oder gib den Code einer anderen Person ein, um euch zu verbinden."
            action={<Users />}
          />
        )}
      </section>
    </div>
  );
}
