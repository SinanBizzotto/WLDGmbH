import { describe, expect, it, vi } from "vitest";
import { createCoalescingSave, createSequentialQueue } from "./sequentialQueue";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("createSequentialQueue", () => {
  it("runs operations in the order they were enqueued", async () => {
    const enqueue = createSequentialQueue();
    const order: number[] = [];
    const a = deferred<void>();
    const b = deferred<void>();

    const first = enqueue(async () => {
      await a.promise;
      order.push(1);
    });
    const second = enqueue(async () => {
      await b.promise;
      order.push(2);
    });

    // Resolve the *second* operation's gate first — if the queue didn't
    // serialize, "2" would land before "1".
    b.resolve();
    await Promise.resolve();
    a.resolve();
    await Promise.all([first, second]);

    expect(order).toEqual([1, 2]);
  });

  it("never runs two operations concurrently", async () => {
    const enqueue = createSequentialQueue();
    let inFlight = 0;
    let maxInFlight = 0;

    const run = () =>
      enqueue(async () => {
        inFlight++;
        maxInFlight = Math.max(maxInFlight, inFlight);
        await Promise.resolve();
        await Promise.resolve();
        inFlight--;
      });

    await Promise.all([run(), run(), run(), run()]);
    expect(maxInFlight).toBe(1);
  });

  it("propagates each operation's own result/rejection to its caller", async () => {
    const enqueue = createSequentialQueue();
    await expect(enqueue(() => Promise.resolve("ok"))).resolves.toBe("ok");
    await expect(enqueue(() => Promise.reject(new Error("boom")))).rejects.toThrow(
      "boom",
    );
  });

  it("keeps running later operations after an earlier one rejects", async () => {
    const enqueue = createSequentialQueue();
    const failing = enqueue(() => Promise.reject(new Error("fail")));
    const after = enqueue(() => Promise.resolve("still runs"));

    await expect(failing).rejects.toThrow("fail");
    await expect(after).resolves.toBe("still runs");
  });
});

describe("createCoalescingSave", () => {
  it("saves the latest value when called repeatedly before the first save starts", async () => {
    const enqueue = createSequentialQueue();
    const save = vi.fn().mockResolvedValue(undefined);
    const coalesced = createCoalescingSave(enqueue, save);

    const calls = [coalesced("v1"), coalesced("v2"), coalesced("v3")];
    await Promise.all(calls);

    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith("v3");
  });

  it("still saves a value that arrives while a previous save is in flight", async () => {
    const gate = deferred<void>();
    const enqueue = createSequentialQueue();
    const save = vi.fn().mockImplementation(async (value: string) => {
      if (value === "v1") await gate.promise;
    });
    const coalesced = createCoalescingSave(enqueue, save);

    const first = coalesced("v1");
    // Give the first call's queued callback a tick to start running and
    // consume "v1" as `pending` before the second call arrives.
    await Promise.resolve();
    await Promise.resolve();
    const second = coalesced("v2");

    gate.resolve();
    await Promise.all([first, second]);

    expect(save).toHaveBeenCalledTimes(2);
    expect(save).toHaveBeenNthCalledWith(1, "v1");
    expect(save).toHaveBeenNthCalledWith(2, "v2");
  });

  it("never overlaps two save calls", async () => {
    const enqueue = createSequentialQueue();
    let inFlight = 0;
    let overlapped = false;
    const save = vi.fn().mockImplementation(async () => {
      inFlight++;
      if (inFlight > 1) overlapped = true;
      await Promise.resolve();
      await Promise.resolve();
      inFlight--;
    });
    const coalesced = createCoalescingSave(enqueue, save);

    await Promise.all([coalesced("a"), coalesced("b"), coalesced("c")]);

    expect(overlapped).toBe(false);
  });
});
