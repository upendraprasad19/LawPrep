import { expect, test } from 'vitest';
import { endLocalSession } from '../../apps/learner/src/features/auth/logout';
test('logout clears only owned authentication storage even when revocation fails', async () => {
  const values = new Map([['lawprep.auth', 'token'], ['lawprep.auth-code-verifier', 'secret'], ['other-app', 'keep']]);
  let cleared = false;
  const result = await endLocalSession({
    revoke: async () => { throw new Error('offline'); },
    clearView: () => { cleared = true; },
    removeItem: key => { expect(cleared).toBe(true); values.delete(key); }
  });
  expect(result).toBe(false); expect([...values]).toEqual([['other-app', 'keep']]);
});
