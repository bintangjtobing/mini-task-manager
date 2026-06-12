import { describe, expect, it } from 'vitest';
import { evaluateTransition, nextStatus } from './status';

describe('status transitions (strict linear flow)', () => {
  it('advances exactly one step at a time', () => {
    expect(evaluateTransition('to_do', 'pending')).toEqual({ kind: 'valid', from: 'to_do', to: 'pending' });
    expect(evaluateTransition('pending', 'in_progress')).toEqual({
      kind: 'valid',
      from: 'pending',
      to: 'in_progress',
    });
    expect(evaluateTransition('in_progress', 'done')).toEqual({ kind: 'valid', from: 'in_progress', to: 'done' });
  });

  it('treats setting the same status as an idempotent no-op', () => {
    expect(evaluateTransition('to_do', 'to_do')).toEqual({ kind: 'noop' });
    expect(evaluateTransition('pending', 'pending')).toEqual({ kind: 'noop' });
    expect(evaluateTransition('done', 'done')).toEqual({ kind: 'noop' });
  });

  it('rejects skipping a step', () => {
    expect(evaluateTransition('to_do', 'in_progress').kind).toBe('invalid');
    expect(evaluateTransition('to_do', 'done').kind).toBe('invalid');
    expect(evaluateTransition('pending', 'done').kind).toBe('invalid');
  });

  it('rejects moving backwards', () => {
    expect(evaluateTransition('pending', 'to_do').kind).toBe('invalid');
    expect(evaluateTransition('in_progress', 'pending').kind).toBe('invalid');
    expect(evaluateTransition('done', 'to_do').kind).toBe('invalid');
  });

  it('treats "done" as a terminal state', () => {
    expect(nextStatus('done')).toBeNull();
    expect(evaluateTransition('done', 'in_progress').kind).toBe('invalid');
  });
});
