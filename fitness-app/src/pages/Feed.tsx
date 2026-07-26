import { useEffect, useState } from "react";
import {
  Dumbbell,
  Heart,
  MessageCircle,
  Send,
  Trash2,
} from "lucide-react";
import { useFitness } from "../data/FitnessContext";
import { ConfirmDialog, EmptyState, LoadingSkeleton, useToast } from "../components/ui";
import { ImagePicker } from "../components/ImagePicker";
import { formatRelativeTime } from "../lib/time";
import type { Post, PostComment, PostKind } from "../types";

function PostAvatar({
  name,
  url,
}: {
  name: string;
  url?: string;
}) {
  return url ? (
    <img className="friend-avatar" src={url} alt="" />
  ) : (
    <div className="friend-avatar friend-avatar--placeholder">
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}

function WorkoutSummaryCard({ post }: { post: Post }) {
  const summary = post.workoutSummary;
  if (!summary) return null;
  return (
    <div className="post-workout">
      <span className="post-workout__icon">
        <Dumbbell />
      </span>
      <div>
        <strong>{summary.planName}</strong>
        <div className="post-workout__stats">
          <span>{Math.round(summary.durationSeconds / 60)} Min.</span>
          <span>{Math.round(summary.totalVolumeKg).toLocaleString("de-CH")} kg</span>
          <span>{summary.exerciseCount} Übungen</span>
        </div>
      </div>
    </div>
  );
}

function CommentRow({
  comment,
  canDelete,
  onDelete,
}: {
  comment: PostComment;
  canDelete: boolean;
  onDelete: () => void;
}) {
  return (
    <li className="post-comment">
      <PostAvatar name={comment.authorDisplayName} url={comment.authorAvatarUrl} />
      <div>
        <strong>{comment.authorDisplayName}</strong>
        <p>{comment.body}</p>
      </div>
      {canDelete && (
        <button
          type="button"
          className="post-comment__delete"
          aria-label="Kommentar löschen"
          onClick={onDelete}
        >
          <Trash2 size={13} />
        </button>
      )}
    </li>
  );
}

function PostCard({
  post,
  currentUserId,
  onToggleLike,
  onDelete,
}: {
  post: Post;
  currentUserId: string;
  onToggleLike: () => void;
  onDelete: () => void;
}) {
  const { loadComments, addComment, deleteComment } = useFitness();
  const toast = useToast();
  const [expanded, setExpanded] = useState(false);
  const [comments, setComments] = useState<PostComment[] | null>(null);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [commentCount, setCommentCount] = useState(post.commentCount);

  const toggleExpanded = async () => {
    setExpanded((current) => !current);
    if (!expanded && comments === null) {
      setCommentsLoading(true);
      try {
        setComments(await loadComments(post.id));
      } catch {
        toast("Kommentare konnten nicht geladen werden", "error");
      } finally {
        setCommentsLoading(false);
      }
    }
  };

  const submitComment = async (event: React.FormEvent) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body) return;
    try {
      const comment = await addComment(post.id, body);
      setComments((current) => [...(current ?? []), comment]);
      setCommentCount((count) => count + 1);
      setDraft("");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Fehler", "error");
    }
  };

  const removeComment = async (commentId: string) => {
    try {
      await deleteComment(post.id, commentId);
      setComments((current) => (current ?? []).filter((c) => c.id !== commentId));
      setCommentCount((count) => Math.max(0, count - 1));
    } catch {
      toast("Kommentar konnte nicht gelöscht werden", "error");
    }
  };

  return (
    <article className="card post-card">
      <div className="post-card__header">
        <PostAvatar name={post.authorDisplayName} url={post.authorAvatarUrl} />
        <div>
          <strong>{post.authorDisplayName}</strong>
          <small>{formatRelativeTime(post.createdAt)}</small>
        </div>
        {post.userId === currentUserId && (
          <button
            type="button"
            className="icon-button post-card__delete"
            aria-label="Beitrag löschen"
            onClick={onDelete}
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
      {post.kind === "workout" && <WorkoutSummaryCard post={post} />}
      {post.caption && <p className="post-card__caption">{post.caption}</p>}
      {post.imageUrl && (
        <div className="post-card__image">
          <img src={post.imageUrl} alt="" />
        </div>
      )}
      <div className="post-card__actions">
        <button
          type="button"
          className={`post-action ${post.likedByMe ? "is-active" : ""}`}
          onClick={onToggleLike}
        >
          <Heart fill={post.likedByMe ? "currentColor" : "none"} />
          {post.likeCount}
        </button>
        <button type="button" className="post-action" onClick={() => void toggleExpanded()}>
          <MessageCircle />
          {commentCount}
        </button>
      </div>
      {expanded && (
        <div className="post-card__comments">
          {commentsLoading ? (
            <p className="friend-stats__empty">Lädt Kommentare …</p>
          ) : (
            <ul className="post-comment-list">
              {(comments ?? []).map((comment) => (
                <CommentRow
                  key={comment.id}
                  comment={comment}
                  canDelete={
                    comment.userId === currentUserId ||
                    post.userId === currentUserId
                  }
                  onDelete={() => void removeComment(comment.id)}
                />
              ))}
            </ul>
          )}
          <form className="post-comment-form" onSubmit={submitComment}>
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Kommentar schreiben …"
              maxLength={300}
            />
            <button type="submit" className="icon-button" aria-label="Senden">
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </article>
  );
}

export default function Feed() {
  const { store, createPost, deletePost, toggleLike, loadFeed } = useFitness();
  const toast = useToast();
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [kind, setKind] = useState<PostKind>("text");
  const [caption, setCaption] = useState("");
  const [image, setImage] = useState<string | undefined>();
  const [sessionId, setSessionId] = useState("");
  const [posting, setPosting] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const completedSessions = store.sessions.filter(
    (s) => s.status === "completed",
  );

  useEffect(() => {
    loadFeed()
      .then(setPosts)
      .catch(() => toast("Feed konnte nicht geladen werden", "error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (kind === "text" && !caption.trim() && !image) {
      toast("Schreibe etwas oder füge ein Foto hinzu", "error");
      return;
    }
    if (kind === "workout" && !sessionId) {
      toast("Wähle ein Workout aus", "error");
      return;
    }
    setPosting(true);
    try {
      const post = await createPost({
        kind,
        caption: caption.trim() || undefined,
        imageUrl: kind === "text" ? image : undefined,
        workoutSessionId: kind === "workout" ? sessionId : undefined,
      });
      setPosts((current) => [post, ...(current ?? [])]);
      setCaption("");
      setImage(undefined);
      setSessionId("");
      toast("Beitrag veröffentlicht");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Fehler", "error");
    } finally {
      setPosting(false);
    }
  };

  const handleToggleLike = async (post: Post) => {
    setPosts(
      (current) =>
        current?.map((p) =>
          p.id === post.id
            ? {
                ...p,
                likedByMe: !p.likedByMe,
                likeCount: p.likeCount + (p.likedByMe ? -1 : 1),
              }
            : p,
        ) ?? null,
    );
    try {
      await toggleLike(post.id, post.likedByMe);
    } catch {
      toast("Like konnte nicht gespeichert werden", "error");
      setPosts(
        (current) =>
          current?.map((p) => (p.id === post.id ? post : p)) ?? null,
      );
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const id = pendingDelete;
    setPendingDelete(null);
    try {
      await deletePost(id);
      setPosts((current) => (current ?? []).filter((p) => p.id !== id));
      toast("Beitrag gelöscht");
    } catch {
      toast("Beitrag konnte nicht gelöscht werden", "error");
    }
  };

  return (
    <div className="stack-page">
      <div className="page-title">
        <div>
          <p>COMMUNITY</p>
          <h2>Feed</h2>
        </div>
      </div>

      <section className="card post-composer">
        <div className="post-composer__tabs">
          <button
            type="button"
            className={kind === "text" ? "is-active" : ""}
            onClick={() => setKind("text")}
          >
            Beitrag
          </button>
          <button
            type="button"
            className={kind === "workout" ? "is-active" : ""}
            onClick={() => setKind("workout")}
          >
            Workout teilen
          </button>
        </div>
        <form onSubmit={submit}>
          <textarea
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            placeholder={
              kind === "text"
                ? "Was möchtest du teilen?"
                : "Kommentar zu deinem Workout (optional)"
            }
            maxLength={500}
          />
          {kind === "text" && (
            <ImagePicker
              bucket="post-images"
              userId={store.profile.id}
              value={image}
              onChange={setImage}
              label={image ? "Foto ändern" : "Foto hinzufügen"}
              shape="square"
            />
          )}
          {kind === "workout" &&
            (completedSessions.length ? (
              <select
                value={sessionId}
                onChange={(event) => setSessionId(event.target.value)}
              >
                <option value="">Workout auswählen …</option>
                {completedSessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.planName} ·{" "}
                    {new Date(session.startedAt).toLocaleDateString("de-CH")}
                  </option>
                ))}
              </select>
            ) : (
              <p className="friend-stats__empty">
                Noch keine abgeschlossenen Workouts zum Teilen.
              </p>
            ))}
          <button
            className="button button--primary"
            type="submit"
            disabled={posting}
          >
            Posten
          </button>
        </form>
      </section>

      {posts === null ? (
        <LoadingSkeleton cards={3} />
      ) : posts.length ? (
        <div className="post-feed">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={store.profile.id}
              onToggleLike={() => void handleToggleLike(post)}
              onDelete={() => setPendingDelete(post.id)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Noch keine Beiträge"
          text="Teile deinen ersten Beitrag oder ein abgeschlossenes Workout mit deinen Freunden."
          action={<Dumbbell />}
        />
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Beitrag löschen?"
        message="Der Beitrag wird für alle Freunde entfernt."
        danger
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
