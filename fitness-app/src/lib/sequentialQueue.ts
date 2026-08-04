/**
 * Runs async operations strictly in the order they were enqueued — no two
 * run concurrently, so an older network response can never resolve after
 * (and overwrite) a newer one. Extracted from the workout-session autosave
 * fix: rapid-fire saves (e.g. one per set-completion click) must never
 * overlap or land out of order.
 */
export function createSequentialQueue() {
  let tail: Promise<unknown> = Promise.resolve();
  return function enqueue<T>(run: () => Promise<T>): Promise<T> {
    const result = tail.then(run, run);
    tail = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  };
}

export type Enqueue = <T>(run: () => Promise<T>) => Promise<T>;

/**
 * Wraps a sequential queue so rapid repeated calls collapse to just the
 * latest value — safe when every call sends a full snapshot (not a delta),
 * since only the final state matters. Avoids one network round-trip per
 * click when a user completes several sets in quick succession.
 */
export function createCoalescingSave<T>(
  enqueue: Enqueue,
  save: (value: T) => Promise<void>,
): (value: T) => Promise<void> {
  let pending: T | null = null;
  return (value: T) => {
    pending = value;
    return enqueue(async () => {
      const next = pending;
      if (next === null) return;
      pending = null;
      await save(next);
    });
  };
}
