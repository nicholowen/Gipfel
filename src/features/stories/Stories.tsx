import { Link } from 'react-router-dom';
import { useStories, type StoryStatus } from '../../data/instance';
import { STORY_UNLOCK } from '../../domain/stories';
import { Hint, useOneTimeHint } from '../../ui/Hint';
import { PageBar } from '../lessons/Lessons';

const pct = (ratio: number) => `${Math.floor(ratio * 100)}%`;

/** All graded stories: the ones the learner can read now, then the ones still ahead. */
export function Stories() {
  const all = useStories();
  if (!all) return null;
  const ready = all.filter((s) => s.ready);
  const later = all.filter((s) => !s.ready);

  return (
    <main className="page stories">
      <PageBar title="Stories" />
      <p className="muted">
        Short stories and conversations written with the words you have learned. Read along while they are read aloud, and tap any word to
        see what it means.
      </p>

      {ready.length > 0 && (
        <section>
          <div className="section-head">
            <h2>Ready to read</h2>
          </div>
          <StoryHint />
          <ul className="story-list">
            {ready.map((s) => (
              <StoryRow key={s.story.id} s={s} />
            ))}
          </ul>
        </section>
      )}

      {later.length > 0 && (
        <section>
          <div className="section-head">
            <h2>Coming up</h2>
            <span className="muted">opens when you know {pct(STORY_UNLOCK)} of the words</span>
          </div>
          <ul className="story-list">
            {later.map((s) => (
              <StoryRow key={s.story.id} s={s} />
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

function StoryRow({ s }: { s: StoryStatus }) {
  const { story, coverage, ready, read } = s;
  const body = (
    <>
      <span className="story-row__text">
        <span className="story-row__title" lang="de">
          {story.title}
          {ready && !read && <span className="story-row__new">neu</span>}
        </span>
        <span className="story-row__sub">
          {story.titleEn} · {story.kind === 'dialogue' ? 'conversation' : 'story'} · {coverage.total} words
        </span>
      </span>
      <span className="story-row__meter" aria-label={`You know ${pct(coverage.ratio)} of the words`}>
        <span className="story-row__pct">{pct(coverage.ratio)}</span>
        <span className="story-row__bar">
          <span style={{ width: pct(coverage.ratio) }} />
        </span>
      </span>
    </>
  );
  return (
    <li>
      {ready ? (
        <Link to={`/stories/${story.id}`} className="story-row">
          {body}
        </Link>
      ) : (
        <div className="story-row is-locked">{body}</div>
      )}
    </li>
  );
}

/** Shown once, the first time a story is ready. */
function StoryHint() {
  const { show, dismiss } = useOneTimeHint('story-unlocked', true);
  return <Hint id="story-unlocked" show={show} onDismiss={dismiss} />;
}
