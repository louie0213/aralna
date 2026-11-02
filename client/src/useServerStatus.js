import { useSyncExternalStore } from 'react';
import { getServerStatus, subscribeToServerStatus } from './serverStatus.js';

export function useServerStatus() {
  return useSyncExternalStore(subscribeToServerStatus, getServerStatus, getServerStatus);
}
