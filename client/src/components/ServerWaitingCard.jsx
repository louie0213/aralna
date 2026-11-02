import { useEffect, useState } from 'react';
import './ServerWaitingCard.css';

function WaitingRobot({ phase }) {
  return (
    <svg className={`server-waiting-card__robot phase-${phase}`} viewBox="0 0 300 210" aria-hidden="true" focusable="false">
      <path className="sw-ground" d="M22 182q61-3 119 0t137-1" />
      <g className="sw-clock">
        <path className="sw-clock-circle" d="M223 31q0-4 4-4h39q4 0 4 4v39q0 4-4 4h-39q-4 0-4-4z" />
        <path className="sw-clock-face" d="M228 36q0-3 3-3h31q3 0 3 3v29q0 3-3 3h-31q-3 0-3-3z" />
        <path className="sw-clock-mark" d="M244 37v3m0 23v3m-14-14h3m23 0h3" />
        <path className="sw-clock-hand" d="M244 51V40m0 11 8 5" />
        <circle className="sw-clock-pin" cx="244" cy="51" r="2" />
      </g>

      <g className="sw-robot">
        <g className="sw-antenna-group">
          <path className="sw-antenna" d="M109 55V43" />
          <circle className="sw-antenna-tip" cx="109" cy="38" r="5" />
        </g>
        <g className="sw-head">
          <path className="sw-head-shell" d="M70 64q0-13 13-13h53q13 0 13 13v36q0 13-13 13H83q-13 0-13-13z" />
          <path className="sw-face" d="M78 68q0-7 7-7h49q7 0 7 7v24q0 7-7 7H85q-7 0-7-7z" />
          <g className="sw-eyes-open">
            <ellipse cx="96" cy="77" rx="3.5" ry="5" />
            <ellipse cx="122" cy="77" rx="3.5" ry="5" />
          </g>
          <g className="sw-eyes-closed">
            <path d="M90 79q6 5 12 0m14 0q6 5 12 0" />
          </g>
          <path className="sw-mouth" d="M99 89q9 6 18 0" />
        </g>
        <path className="sw-body" d="M81 116q0-5 5-5h47q5 0 5 5v42H81z" />
        <path className="sw-chest" d="M94 124h30m-30 8h20" />
        <g className="sw-left-arm">
          <path className="sw-limb" d="M82 121H65v20h17" />
        </g>
        <g className="sw-right-arm">
          <path className="sw-limb" d="M137 121h17v18" />
          <circle className="sw-watch" cx="154" cy="143" r="10" />
          <path className="sw-watch-hand" d="M154 143v-5m0 5 4 2" />
        </g>
        <g className="sw-legs">
          <path className="sw-limb sw-leg-left" d="M94 158v12m26-12v12" />
          <path className="sw-limb sw-foot-left" d="M85 171h17m10 0h17" />
        </g>
        <g className="sw-sitting-limbs">
          <path className="sw-limb sw-sit-leg" d="M92 155v15q0 5 6 5h16m5-20v9q0 5 6 5h12" />
          <path className="sw-limb sw-resting-arm" d="M137 122h14v-12" />
          <circle className="sw-watch sw-sit-watch" cx="151" cy="106" r="8" />
        </g>
        <path className="sw-shrug" d="M77 115q-7-8-13 0m75 0q7-8 13 0" />
      </g>
      <g className="sw-zs">
        <text className="sw-z sw-z-one" x="170" y="58">z</text>
        <text className="sw-z sw-z-two" x="188" y="42">z</text>
        <text className="sw-z sw-z-three" x="205" y="27">z</text>
      </g>
      <path className="sw-doodle" d="m43 74 3 7 7 3-7 3-3 7-3-7-7-3 7-3z" />
    </svg>
  );
}

export default function ServerWaitingCard({ status, onRetry }) {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (status !== 'waking') {
      setElapsedMs(0);
      return undefined;
    }
    const startedAt = Date.now();
    const timer = window.setInterval(() => setElapsedMs(Date.now() - startedAt), 100);
    return () => window.clearInterval(timer);
  }, [status]);

  const failed = status === 'failed';
  const phase = elapsedMs < 8000 ? 'impatient' : elapsedMs < 20000 ? 'tired' : 'dozing';

  return (
    <section
      className={`server-waiting-card${failed ? ' is-failed' : ''}`}
      aria-busy={!failed}
    >
      <WaitingRobot phase={phase} />
      <div className="server-waiting-card__copy" role="status" aria-live="polite" aria-atomic="true">
        <p className="server-waiting-card__title">
          {failed ? "Can't reach the server" : (
            <>
              Waking up the server
              <span className="server-waiting-card__dots" aria-hidden="true"><i>.</i><i>.</i><i>.</i></span>
            </>
          )}
        </p>
        <p className="server-waiting-card__detail">
          {failed ? 'Please check your connection and try again.' : 'This can take up to a minute on the first visit.'}
        </p>
      </div>
      {failed && (
        <button className="btn btn-primary server-waiting-card__retry" type="button" onClick={onRetry}>
          Try again
        </button>
      )}
    </section>
  );
}
