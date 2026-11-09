import { expect, test } from 'vitest';
import type { AccessSnapshot } from '@lawprep/contracts';
import { canAccess } from '../../packages/domain/src/access';

const userId = '10000000-0000-4000-8000-000000000001';
const checkedAt = '2026-11-08T10:00:00Z';
const expiresAt = '2026-11-09T10:00:00Z';
const explore: AccessSnapshot = { userId, checkedAt, cycles: [] };
const prepare: AccessSnapshot = {
  ...explore, cycles: [{ cycleId: 'clat-2027', examId: 'clat-ug', label: 'CLAT 2027', prepareUntil: expiresAt, aiUntil: expiresAt }]
};
const paid = { kind: 'published' as const, cycleId: 'clat-2027', sample: false };
const sample = { ...paid, sample: true };

test('Explore can use designated sample activities and save progress', () => {
  for (const action of ['read-lesson', 'save-progress', 'start-attempt'] as const) {
    expect(canAccess(explore, action, sample).allowed).toBe(true);
    expect(canAccess(explore, action, paid).allowed).toBe(false);
  }
});

test('unknown actions fail closed even for samples and active Prepare', () => {
  expect(Reflect.apply(canAccess, undefined, [explore, 'unrecognised', sample])).toEqual({ allowed: false, reason: 'resource' });
  expect(Reflect.apply(canAccess, undefined, [prepare, 'unrecognised', paid])).toEqual({ allowed: false, reason: 'resource' });
});

test('Prepare requires the exact cycle and expires at the end instant', () => {
  expect(canAccess(prepare, 'read-lesson', paid).allowed).toBe(true);
  expect(canAccess(prepare, 'start-attempt', { ...paid, cycleId: 'clat-2028' }).allowed).toBe(false);
  expect(canAccess({ ...prepare, checkedAt: expiresAt }, 'start-attempt', paid).allowed).toBe(false);
});

test('expiry preserves an owned authorised attempt and completed history', () => {
  const attempt = { kind: 'attempt' as const, cycleId: 'clat-2027', attemptCycleId: 'clat-2027', ownerId: userId, state: 'in-progress' as const, authorisedAtStart: true };
  expect(canAccess(explore, 'finish-attempt', attempt).allowed).toBe(true);
  expect(canAccess(explore, 'finish-attempt', { ...attempt, authorisedAtStart: false }).allowed).toBe(false);
  expect(canAccess(explore, 'finish-attempt', { ...attempt, ownerId: 'other-user' }).allowed).toBe(false);
  expect(canAccess(explore, 'finish-attempt', { ...attempt, cycleId: 'clat-2028' }).allowed).toBe(false);
  expect(canAccess(explore, 'review-attempt', attempt).allowed).toBe(false);
  expect(canAccess(explore, 'review-attempt', { ...attempt, state: 'completed' }).allowed).toBe(true);
  expect(canAccess(explore, 'review-attempt', { ...attempt, state: 'completed', ownerId: 'other-user' }).allowed).toBe(false);
});

test('AI requires current Prepare, AI Guide and a positive server quota decision', () => {
  const context = { kind: 'ai' as const, cycleId: 'clat-2027', allowanceAvailable: true };
  expect(canAccess(prepare, 'use-ai', context).allowed).toBe(true);
  expect(canAccess(prepare, 'use-ai', { ...context, allowanceAvailable: false }).allowed).toBe(false);
  expect(canAccess(explore, 'use-ai', context).allowed).toBe(false);
  expect(canAccess({ ...prepare, checkedAt: expiresAt }, 'use-ai', context).allowed).toBe(false);
  expect(canAccess({ ...prepare, cycles: [{ ...prepare.cycles[0], aiUntil: null }] }, 'use-ai', context).allowed).toBe(false);
});
