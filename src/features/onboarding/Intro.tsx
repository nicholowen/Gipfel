import { useRef, useState } from 'react';
import { introCards } from '../../domain/onboarding';
import { useTheme } from '../../ui/theme-context';
import { STAGE_KEYS } from '../../ui/themes';
import { MOUNTAIN_LOGO } from '../../ui/AppHeader';
import { StageIcon } from '../dashboard/parts';

/**
 * The first-run intro: five short cards, swipe or tap through, skippable at any point.
 * `onFinish` runs for both finishing and skipping; the caller saves the flag.
 */
export function Intro({ onFinish }: { onFinish: () => void }) {
  const { theme } = useTheme();
  const cards = introCards(theme);
  const [index, setIndex] = useState(0);
  const touchX = useRef<number | null>(null);
  const card = cards[index];
  const last = index === cards.length - 1;

  const go = (to: number) => setIndex(Math.max(0, Math.min(cards.length - 1, to)));
  const next = () => (last ? onFinish() : go(index + 1));

  return (
    <main
      className="page intro"
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) < 50) return;
        if (dx < 0) {
          if (!last) go(index + 1);
        } else go(index - 1);
      }}
    >
      <div className="intro__top">
        <span className="brand intro__brand">
          {MOUNTAIN_LOGO}
          <span className="brand__name">Gipfel</span>
        </span>
        {!last && (
          <button type="button" className="link-button" onClick={onFinish}>
            Skip
          </button>
        )}
      </div>

      <section className="intro__card" aria-live="polite" key={index}>
        <p className="intro__step">
          {index + 1} of {cards.length}
        </p>
        <h2 className="intro__heading">{card.heading}</h2>
        <p className="intro__body">{card.body}</p>
        {card.showStages && (
          <ol className="intro__stages" aria-label="The stages, from first to last">
            {STAGE_KEYS.map((key) => (
              <li key={key}>
                <StageIcon theme={theme.id} stage={key} />
                <span lang="de">{theme.stages[key].de}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <div className="intro__nav">
        <div className="intro__dots" aria-hidden="true">
          {cards.map((_, i) => (
            <span key={i} className={i === index ? 'is-current' : ''} />
          ))}
        </div>
        <div className="intro__buttons">
          {index > 0 && (
            <button type="button" className="button button--quiet" onClick={() => go(index - 1)}>
              Back
            </button>
          )}
          <button type="button" className="button intro__next" onClick={next}>
            <span lang="de">{card.button.de}</span>
            {/* The English shows the first time each German label appears. */}
            {(index === 0 || last) && <span className="intro__gloss">{card.button.en}</span>}
          </button>
        </div>
      </div>
    </main>
  );
}
