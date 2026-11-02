import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getItem } from '../../content/curriculum';
import { loadLessonBatch, repo, useSettings } from '../../data/instance';
import { DAILY_NEW_ITEMS, type LessonPause } from '../../domain/pacing';
import { nextReviewAt } from '../../domain/scheduler';
import { GermanWord, ItemInfo, SpeakButton } from '../../ui/ItemInfo';
import { reportError } from '../../ui/errors';
import { useTheme } from '../../ui/theme-context';
import { speak, spokenForm } from '../../ui/speech';
import { Quiz } from '../quiz/Quiz';

type Phase = { name: 'loading' } | { name: 'learn'; index: number } | { name: 'quiz' } | { name: 'done' };

export function Lessons() {
  const settings = useSettings();
  const { theme } = useTheme();
  const [batch, setBatch] = useState<string[]>([]);
  const [pause, setPause] = useState<LessonPause>(null);
  const [phase, setPhase] = useState<Phase>({ name: 'loading' });
  const [round, setRound] = useState(0);

  useEffect(() => {
    let live = true;
    loadLessonBatch(settings.lessonBatchSize, Date.now())
      .then(({ ids, pause }) => {
        if (!live) return;
        setBatch(ids);
        setPause(pause);
        setPhase({ name: 'learn', index: 0 });
      })
      .catch(reportError);
    return () => {
      live = false;
    };
  }, [settings.lessonBatchSize, round]);

  const current = phase.name === 'learn' ? batch[phase.index] : undefined;
  useEffect(() => {
    if (current && settings.autoplayAudio) speak(spokenForm(getItem(current)));
  }, [current, settings.autoplayAudio]);

  if (phase.name === 'loading') return null;

  if (batch.length === 0) {
    return (
      <main className="page centred">
        <h1>{pause === 'daily' ? 'That’s today’s new words' : 'No lessons right now'}</h1>
        <p className="muted">
          {pause === 'daily' && <>You’ve started {DAILY_NEW_ITEMS} new words today. More arrive tomorrow; keep up with your reviews in the meantime.</>}
          {pause === 'busy' && (
            <>
              Lots of words are still in <span lang="de">{theme.stages[1].de}</span>. Clear some reviews and new lessons will come back.
            </>
          )}
          {pause === 'empty' && (
            <>
              You’re through every word written so far. Compounds unlock when the words they are built from reach{' '}
              <span lang="de">{theme.stages[2].de}</span>, and new levels are on the way.
            </>
          )}
        </p>
        <Link to="/" className="button">
          Back home
        </Link>
      </main>
    );
  }

  if (phase.name === 'done') {
    return (
      <main className="page centred">
        <h1>{batch.length} new words</h1>
        <p className="muted">
          First review at {new Date(nextReviewAt(1, Date.now())!).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}.
        </p>
        <div className="row">
          <button type="button" className="button" onClick={() => { setPhase({ name: 'loading' }); setRound((r) => r + 1); }}>
            More lessons
          </button>
          <Link to="/" className="button button--quiet">
            Home
          </Link>
        </div>
      </main>
    );
  }

  if (phase.name === 'quiz') {
    return (
      <main className="page">
        <PageBar title="Lesson quiz" />
        <Quiz
          itemIds={batch}
          onFinished={() =>
            repo
              .finishLessons(batch, Date.now())
              .then(() => setPhase({ name: 'done' }))
              .catch(reportError)
          }
        />
      </main>
    );
  }

  const item = getItem(batch[phase.index]);
  const last = phase.index === batch.length - 1;

  return (
    <main className="page">
      <PageBar title={`Lesson ${phase.index + 1} of ${batch.length}`} />
      <div className="dots" aria-hidden="true">
        {batch.map((id, i) => (
          <span key={id} className={i === phase.index ? 'is-on' : i < phase.index ? 'is-done' : ''} />
        ))}
      </div>
      <section className={`lesson-card${item.article ? ` lesson-card--${item.article}` : ''}`}>
        <GermanWord item={item} size="xl" />
        <p className="lesson-card__meaning">{item.meanings.join(', ')}</p>
        <SpeakButton item={item} />
      </section>
      <ItemInfo item={item} showWord={false} />
      {item.article && (
        <p className="legend small">
          <span className="gender--der">der</span> the Bear · <span className="gender--die">die</span> the Diva ·{' '}
          <span className="gender--das">das</span> the Box
        </p>
      )}
      <div className="row row--end sticky-actions">
        {phase.index > 0 && (
          <button type="button" className="button button--quiet" onClick={() => setPhase({ name: 'learn', index: phase.index - 1 })}>
            Back
          </button>
        )}
        <button
          type="button"
          className="button"
          onClick={() => setPhase(last ? { name: 'quiz' } : { name: 'learn', index: phase.index + 1 })}
        >
          {last ? 'Start quiz' : 'Next'}
        </button>
      </div>
    </main>
  );
}

export function PageBar({ title, back = '/', backLabel = 'Home' }: { title: string; back?: string; backLabel?: string }) {
  return (
    <header className="pagebar">
      <Link to={back} className="icon-button" aria-label={backLabel}>
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>
      <span>{title}</span>
    </header>
  );
}
