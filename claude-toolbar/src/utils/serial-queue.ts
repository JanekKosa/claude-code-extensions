/**
 * A queue that runs async tasks one at a time, in the order they were handed to it. Generic: knows nothing of the
 * toolbar.
 */

/** Hands a task to a queue; the promise settles as the task did, once it has run. */
export type Enqueue = (task: () => Promise<void>) => Promise<void>;

/**
 * Creates an empty queue. Each task starts once every task handed over before it has settled, whether that one
 * fulfilled or rejected.
 * @returns the function that hands the queue a task
 */
export function serialQueue(): Enqueue {
  let last: Promise<void> = Promise.resolve();
  return (task) => {
    const run = last.then(task);
    last = run.catch(() => undefined);
    return run;
  };
}
