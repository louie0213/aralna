// this file hooks into server status so pages can wait while the API wakes up
import { useSyncExternalStore } from 'react';
import { getServerStatus, subscribeToServerStatus } from './serverStatus.js';

export function useServerStatus() {
  return useSyncExternalStore(subscribeToServerStatus, getServerStatus, getServerStatus);
}
