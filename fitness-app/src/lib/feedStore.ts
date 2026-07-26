import type { PostKind, PostWorkoutSummary } from "../types";

export interface StoredPost {
  id: string;
  userId: string;
  kind: PostKind;
  caption?: string;
  imageUrl?: string;
  workoutSessionId?: string;
  workoutSummary?: PostWorkoutSummary;
  createdAt: string;
}
export interface StoredComment {
  id: string;
  postId: string;
  userId: string;
  body: string;
  createdAt: string;
}
interface FeedData {
  posts: StoredPost[];
  likes: Record<string, string[]>;
  comments: Record<string, StoredComment[]>;
}

const storageKey = (userId: string) => `wld-fitness-feed-v1:${userId}`;

function read(userId: string): FeedData {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return { posts: [], likes: {}, comments: {} };
    const parsed = JSON.parse(raw) as Partial<FeedData>;
    return {
      posts: parsed.posts ?? [],
      likes: parsed.likes ?? {},
      comments: parsed.comments ?? {},
    };
  } catch {
    return { posts: [], likes: {}, comments: {} };
  }
}
function write(userId: string, data: FeedData) {
  localStorage.setItem(storageKey(userId), JSON.stringify(data));
}

export function seedFeedIfEmpty(userId: string, seed: StoredPost[]): FeedData {
  const data = read(userId);
  if (data.posts.length === 0 && seed.length) {
    data.posts = seed;
    write(userId, data);
  }
  return data;
}
export function getFeed(userId: string): FeedData {
  return read(userId);
}
export function addPost(userId: string, post: StoredPost): FeedData {
  const data = read(userId);
  data.posts = [post, ...data.posts];
  write(userId, data);
  return data;
}
export function removePost(userId: string, postId: string): FeedData {
  const data = read(userId);
  data.posts = data.posts.filter((p) => p.id !== postId);
  delete data.likes[postId];
  delete data.comments[postId];
  write(userId, data);
  return data;
}
export function toggleLike(
  userId: string,
  postId: string,
  actorId: string,
): FeedData {
  const data = read(userId);
  const current = data.likes[postId] ?? [];
  data.likes[postId] = current.includes(actorId)
    ? current.filter((id) => id !== actorId)
    : [...current, actorId];
  write(userId, data);
  return data;
}
export function addComment(userId: string, comment: StoredComment): FeedData {
  const data = read(userId);
  data.comments[comment.postId] = [
    ...(data.comments[comment.postId] ?? []),
    comment,
  ];
  write(userId, data);
  return data;
}
export function removeComment(
  userId: string,
  postId: string,
  commentId: string,
): FeedData {
  const data = read(userId);
  data.comments[postId] = (data.comments[postId] ?? []).filter(
    (c) => c.id !== commentId,
  );
  write(userId, data);
  return data;
}
