// this file tracks whether the backend server is reachable
const listeners = new Set();
let status = 'idle';

function publish(nextStatus) {
  if (status === nextStatus) return;
  status = nextStatus;
  listeners.forEach((listener) => listener());
}

export function subscribeToServerStatus(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getServerStatus() {
  return status;
}

export function trackServerRequest() {
  if (status === 'failed') {
    publish('idle');
  }

  let settled = false;
  const wakeTimer = status === 'idle'
    ? window.setTimeout(() => {
      if (!settled && status === 'idle') publish('waking');
    }, 2000)
    : null;
  const failureTimer = window.setTimeout(() => {
    if (settled) return;
    window.clearTimeout(wakeTimer);
    clearTestReadyTimer();
    publish('failed');
  }, 60000);

  function finish(nextStatus) {
    if (settled) return;
    settled = true;
    window.clearTimeout(wakeTimer);
    window.clearTimeout(failureTimer);
    if (!nextStatus) return;

    publish(nextStatus);
  }

  return {
    response: () => finish('ready'),
    networkError: () => finish('failed'),
    cancel: () => finish(),
  };
}
