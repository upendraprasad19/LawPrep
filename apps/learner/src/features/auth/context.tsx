import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from 'react';
import { AccountStore, accountStore } from './store';
const Context = createContext<AccountStore | null>(null);
export function AccountProvider({ children }: { children: ReactNode }) {
  const store = accountStore;
  useEffect(() => store.start(), [store]);
  return <Context value={store}>{children}</Context>;
}
export function useAccount() {
  const store = useContext(Context);
  if (!store) throw new Error('Account provider is missing');
  const state = useSyncExternalStore(store.subscribe, store.snapshot);
  return { ...state, store };
}
