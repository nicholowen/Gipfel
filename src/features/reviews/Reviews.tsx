import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getItem } from '../../content/curriculum';
import { loadDueReviews, repo } from '../../data/instance';
import type { CompletedItem } from '../../domain/review-session';
import { reportError } from '../../ui/errors';
import { GermanWord } from '../../ui/ItemInfo';
import { PageBar } from '../lessons/Lessons';
import { Quiz } from '../quiz/Quiz';

interface Summary {
  right: CompletedItem[];
  wrong: CompletedItem[];
  levelUp: number | null;
}

export function Reviews() {
  const [due, setDue] = useState<string[] | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [levelUp, setLevelUp] = useState<number | null>(null);

  useEffect(() => {
    loadDueReviews(Date.now()).then(setDue).catch(reportError);
  }, []);

  const save = useCallback((items: CompletedItem[]) => {
    repo
      .recordReviews(items, Date.now())
      .then(({ levelBefore, levelAfter }) => {
        if (levelAfter > levelBefore) setLevelUp(levelAfter);
      })
      .catch(reportError);
  }, []);

  if (due === null) return null;

  if (due.length === 0 && !summary) {
    return (
      <main className="page centred">
        <h1>All caught up</h1>
        <p className="muted">No reviews are due. Check the dashboard for when the next ones arrive.</p>
        <Link to="/" className="button">
          Back home
        </Link>
      </main>
    );
  }

  if (summary) {
    return (
      <main className="page">
        <PageBar title="Session summary" />
        {(summary.levelUp ?? levelUp) && (
          <section className="levelup">
            <p className="levelup__kicker">Level up</p>
            <p className="levelup__number">{summary.levelUp ?? levelUp}</p>
            <p className="muted">New words are waiting in your lessons.</p>
          </section>
        )}
        <SummaryList title={`${summary.right.length} went up`} items={summary.right} tone="good" />
        <SummaryList title={`${summary.wrong.length} need more practice`} items={summary.wrong} tone="bad" />
        <div className="row">
          <Link to="/" className="button">
            Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <PageBar title="Reviews" />
      <Quiz
        itemIds={due}
        allowWrapUp
        onSettled={save}
        onFinished={(state) =>
          setSummary({
            right: state.completed.filter((c) => !c.wasWrong),
            wrong: state.completed.filter((c) => c.wasWrong),
            levelUp: null,
          })
        }
      />
    </main>
  );
}

function SummaryList({ title, items, tone }: { title: string; items: CompletedItem[]; tone: 'good' | 'bad' }) {
  if (items.length === 0) return null;
  return (
    <section className={`card summary summary--${tone}`}>
      <h2>{title}</h2>
      <ul>
        {items.map((c) => {
          const item = getItem(c.itemId);
          return (
            <li key={c.itemId}>
              <GermanWord item={item} />
              <span className="muted">{item.meanings[0]}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
