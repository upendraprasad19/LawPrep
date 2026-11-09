import type { AccessSnapshot } from '@lawprep/contracts';

type Action = 'read-lesson' | 'save-progress' | 'start-attempt' | 'finish-attempt' | 'review-attempt' | 'use-ai';
type Resource =
  | { kind: 'published'; cycleId: string; sample: boolean }
  | { kind: 'attempt'; cycleId: string; attemptCycleId: string; ownerId: string; state: 'in-progress' | 'completed'; authorisedAtStart: boolean }
  | { kind: 'ai'; cycleId: string; allowanceAvailable: boolean };
type Decision = { allowed: true } | { allowed: false; reason: 'resource' | 'prepare' | 'ai-guide' | 'allowance' };

// Callers resolve resources and ownership from stored records and obtain a fresh server snapshot per action.
export function canAccess(access: AccessSnapshot, action: Action, resource: Resource): Decision {
  if (action === 'finish-attempt' || action === 'review-attempt') {
    if (resource.kind !== 'attempt' || resource.ownerId !== access.userId ||
      resource.cycleId !== resource.attemptCycleId || !resource.authorisedAtStart ||
      resource.state !== (action === 'finish-attempt' ? 'in-progress' : 'completed')) {
      return { allowed: false, reason: 'resource' };
    }
    return { allowed: true };
  }
  const studyAction = action === 'read-lesson' || action === 'save-progress' || action === 'start-attempt';
  if (!(studyAction && resource.kind === 'published') && !(action === 'use-ai' && resource.kind === 'ai')) {
    return { allowed: false, reason: 'resource' };
  }
  if (resource.kind === 'published' && resource.sample) return { allowed: true };

  const now = Date.parse(access.checkedAt);
  const cycle = access.cycles.find(item => item.cycleId === resource.cycleId);
  if (!cycle || !(Date.parse(cycle.prepareUntil) > now)) return { allowed: false, reason: 'prepare' };
  if (resource.kind === 'ai') {
    if (!cycle.aiUntil || !(Date.parse(cycle.aiUntil) > now)) return { allowed: false, reason: 'ai-guide' };
    if (!resource.allowanceAvailable) return { allowed: false, reason: 'allowance' };
  }
  return { allowed: true };
}
