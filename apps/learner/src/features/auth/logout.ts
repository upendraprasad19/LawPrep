export const authStorageKey = 'lawprep.auth';
export async function endLocalSession(actions: { clearView(): void; revoke(): Promise<boolean>; removeItem(key: string): void }): Promise<boolean> {
  actions.clearView();
  try { return await actions.revoke(); }
  catch { return false; }
  finally {
    for (const key of [authStorageKey, `${authStorageKey}-code-verifier`, `${authStorageKey}-user`]) actions.removeItem(key);
  }
}
