import { useEffect, useState } from 'react';
import { repo, useHintsSeen } from '../data/instance';
import { hintText, type HintId } from '../domain/onboarding';
import { reportError } from './errors';
import { useTheme } from './theme-context';

/**
 * Whether a one-time hint should show now.
 *
 * Once shown it stays up until dismissed, even if it is marked seen meanwhile.
 * With `markOnShow`, it is marked seen as soon as it appears, for hints that vanish by themselves
 * (the quiz moves on to the next question).
 */
export function useOneTimeHint(id: HintId | null, eligible: boolean, { markOnShow = false } = {}) {
  const seen = useHintsSeen();
  const [latched, setLatched] = useState<HintId | null>(null);
  const [dismissed, setDismissed] = useState<readonly HintId[]>([]);
  const fresh = id !== null && eligible && seen !== undefined && !seen.includes(id) && !dismissed.includes(id);

  useEffect(() => {
    // A mark-on-show hint is done once the moment that triggered it has passed.
    if (markOnShow && latched !== null && (latched !== id || !eligible)) {
      setDismissed((d) => [...d, latched]);
      setLatched(null);
      return;
    }
    if (!fresh || latched === id) return;
    setLatched(id);
    if (markOnShow) repo.markHintSeen(id).catch(reportError);
  }, [fresh, id, latched, markOnShow, eligible]);

  const show = id !== null && !dismissed.includes(id) && (latched === id || fresh) && (!markOnShow || eligible);
  const dismiss = () => {
    if (id === null) return;
    setDismissed((d) => [...d, id]);
    repo.markHintSeen(id).catch(reportError);
  };
  return { show, dismiss };
}

/** A one-line callout with a dismiss button. Renders nothing unless `show`. */
export function Hint({ id, show, onDismiss }: { id: HintId | null; show: boolean; onDismiss?: () => void }) {
  const { theme } = useTheme();
  if (!show || id === null) return null;
  return (
    <div className="hint" role="note">
      <svg className="hint__icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 11v6M12 7.5v.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <p className="hint__text">{hintText(id, theme)}</p>
      {onDismiss && (
        <button type="button" className="link-button hint__dismiss" onClick={onDismiss}>
          Got it
        </button>
      )}
    </div>
  );
}
