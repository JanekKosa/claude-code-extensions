/**
 * Tests the serial queue: a task starts only once the one before it has settled, and a task that rejects stops
 * none after it.
 */

import { setImmediate as nextTurn } from 'node:timers/promises';
import { describe, expect, it, vi } from 'vitest';
import { serialQueue } from '../../src/utils/serial-queue';

describe('serialQueue', () => {
  it('starts a task only after the one before it has settled', async () => {
    const enqueue = serialQueue();
    const events: string[] = [];
    let finishFirst = (): void => undefined;
    const first = enqueue(
      () =>
        new Promise<void>((resolve) => {
          events.push('first started');
          finishFirst = () => {
            events.push('first finished');
            resolve();
          };
        }),
    );
    const second = enqueue(async () => {
      events.push('second started');
    });
    await nextTurn();
    expect(events).toEqual(['first started']);
    finishFirst();
    await Promise.all([first, second]);
    expect(events).toEqual(['first started', 'first finished', 'second started']);
  });

  it('runs the next task after one that rejected, which rejects as its task did', async () => {
    const enqueue = serialQueue();
    const failing = enqueue(async () => {
      throw new Error('boom');
    });
    const next = vi.fn(async () => undefined);
    const after = enqueue(next);
    await expect(failing).rejects.toThrow('boom');
    await after;
    expect(next).toHaveBeenCalledOnce();
  });
});
