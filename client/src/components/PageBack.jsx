import { useLocation, useNavigate, useNavigationType } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';

export default function PageBack() {
  const location = useLocation();
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const history = useRef({ entries: [location], index: 0 });
  const [previousLocation, setPreviousLocation] = useState(null);
  const isDashboard = location.pathname === '/app' || location.pathname === '/admin';

  useEffect(() => {
    const historyState = history.current;
    if (historyState.entries[historyState.index].key === location.key) return;

    if (navigationType === 'POP') {
      const previousIndex = historyState.entries.findIndex((entry) => entry.key === location.key);
      if (previousIndex >= 0) {
        historyState.index = previousIndex;
      } else {
        historyState.entries = historyState.entries.slice(0, historyState.index + 1);
        historyState.entries.push(location);
        historyState.index += 1;
      }
    } else if (navigationType === 'REPLACE') {
      historyState.entries[historyState.index] = location;
    } else {
      historyState.entries = historyState.entries.slice(0, historyState.index + 1);
      historyState.entries.push(location);
      historyState.index += 1;
    }

    setPreviousLocation(historyState.entries[historyState.index - 1] || null);
  }, [location, navigationType]);

  if (isDashboard) return null;

  const fallbackPath = location.pathname.startsWith('/admin') ? '/admin' : '/app';

  return (
    <button className="page-back" type="button" onClick={() => navigate(previousLocation ? -1 : fallbackPath)}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m15 18-6-6 6-6M9 12h12" />
      </svg>
      <span>Back</span>
    </button>
  );
}
