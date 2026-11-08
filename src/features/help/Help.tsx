import { useState } from 'react';
import { Link } from 'react-router-dom';
import { repo } from '../../data/instance';
import { DAILY_NEW_ITEMS, EARLY_STAGE_LIMIT } from '../../domain/pacing';
import { STORY_UNLOCK } from '../../domain/stories';
import { reportError } from '../../ui/errors';
import { useTheme } from '../../ui/theme-context';
import { PageBar } from '../lessons/Lessons';

/** How Gipfel works, in plain language, with the theme's own stage names. */
export function Help() {
  const { theme } = useTheme();
  const [hintsReset, setHintsReset] = useState(false);
  const s = (k: 1 | 2 | 5) => <span lang="de">{theme.stages[k].de}</span>;

  return (
    <main className="page help">
      <PageBar title="How Gipfel works" />

      <section className="help__item">
        <h2>What is Gipfel for?</h2>
        <p>Everyday spoken German: understanding people and talking back. It starts from zero and keeps going well past beginner level.</p>
      </section>

      <section className="help__item">
        <h2>Why only {DAILY_NEW_ITEMS} new words a day?</h2>
        <p>
          Every German noun brings an article and a plural, and you review each word in both directions. A steady {DAILY_NEW_ITEMS} a day (about{' '}
          {DAILY_NEW_ITEMS * 30} a month) sticks far better than big batches, and keeps reviews short.
        </p>
      </section>

      <section className="help__item">
        <h2>How do reviews work?</h2>
        <p>
          You type the answer, both ways. A right answer moves the word up a step and waits longer before asking again: 4 hours, 8 hours, 1 day,
          2 days, 1 week, 2 weeks, 1 month, then 4 months. A wrong answer moves it back down.
        </p>
      </section>

      <section className="help__item">
        <h2>
          What are {s(1)}, {s(2)} and the rest?
        </h2>
        <p>
          Your words, grouped by how well you know them: from {s(1)} (newest, reviewed within days) up to {s(5)} (known for months). The four
          boxes beside {s(1)} show how many words sit at each of its steps. The names change with your theme.
        </p>
      </section>

      <section className="help__item">
        <h2>Why did my lessons stop?</h2>
        <p>
          When {EARLY_STAGE_LIMIT} or more words are in {s(1)}, new lessons pause until some move up to {s(2)}. Just keep doing your reviews.
          Lessons also stop for the day after {DAILY_NEW_ITEMS} new words.
        </p>
      </section>

      <section className="help__item">
        <h2>What are levels?</h2>
        <p>
          Each level is a small set of words around one or two everyday scenes, with its own story. Finishing one is a milestone, but new words
          keep flowing either way.
        </p>
      </section>

      <section className="help__item">
        <h2>What are phrases?</h2>
        <p>
          Ready-made chunks like <i lang="de">Wie geht’s?</i> or <i lang="de">Ich hätte gern …</i>, learned as a whole. They come before the
          grammar that explains them, because they make you sound natural fast.
        </p>
      </section>

      <section className="help__item">
        <h2>Can I add my own notes?</h2>
        <p>
          Yes. If a mnemonic doesn’t click, or you have your own trick, tap <b>Add a note</b> under the mnemonic in a lesson, or under{' '}
          <b>Show info</b> after answering a review. Notes stay on this device with the rest of your progress.
        </p>
      </section>

      <section className="help__item">
        <h2>How do stories unlock?</h2>
        <p>
          A story opens once you know at least {Math.round(STORY_UNLOCK * 100)}% of its words. Tap any word you don’t know to see it, and tap{' '}
          <i>Read it to me</i> to hear the whole story.
        </p>
      </section>

      <section className="help__item">
        <h2>When should I start speaking?</h2>
        <p>
          At about 400–500 known words (roughly three months at this pace), Gipfel will tell you you’re ready. From then on, a little real
          conversation each week makes everything else count.
        </p>
      </section>

      <section className="help__item">
        <h2>Is my progress saved?</h2>
        <p>
          Yes, on this device, in this browser. It doesn’t move to another phone or browser yet, and clearing the browser’s site data removes
          it.
        </p>
      </section>

      <div className="help__actions">
        <Link to="/welcome" className="button">
          Replay intro
        </Link>
        <button
          type="button"
          className="button button--quiet"
          disabled={hintsReset}
          onClick={() =>
            repo
              .resetHints()
              .then(() => setHintsReset(true))
              .catch(reportError)
          }
        >
          {hintsReset ? 'Hints will show again' : 'Show hints again'}
        </button>
      </div>
    </main>
  );
}
