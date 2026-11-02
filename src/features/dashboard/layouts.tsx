import { Link } from 'react-router-dom';
import { AppHeader } from '../../ui/AppHeader';
import {
  ActionLink,
  EarlyStageWarning,
  clock,
  LevelBar,
  LevelHint,
  StageRows,
  StoriesLink,
  upcomingBatches,
  UpcomingLine,
  wordCount,
  type LayoutProps,
} from './parts';

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

/* Alpen: a pine header block with contour lines, and the stages as a route up the mountain. */

export function AlpenDashboard({ d, now, theme, levelTitle }: LayoutProps) {
  return (
    <main className="page dash dash--alpen">
      <section className="alpen-hero">
        <svg className="contours" viewBox="0 0 390 260" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <path d="M-10 230 C 60 200, 110 220, 170 180 S 290 120, 400 150" />
          <path d="M-10 205 C 70 175, 120 195, 180 155 S 290 95, 400 125" />
          <path d="M-10 180 C 80 150, 130 170, 190 130 S 295 70, 400 100" />
          <path d="M20 160 C 90 128, 140 146, 200 108 S 300 48, 400 76" />
          <path d="M70 138 C 120 112, 160 124, 212 88 S 300 30, 400 52" />
          <path d="M130 116 C 165 98, 190 102, 228 72 S 296 22, 360 26" />
          <path d="M190 92 C 212 80, 232 78, 252 60 S 290 34, 318 40" />
        </svg>
        <AppHeader className="app-header--hero">
          <p className="streak-chip" title="Days in a row with a finished session">
            <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
              <path d="M3 13c3-1 2-5 5-6s2-5 5-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              <circle cx="3" cy="13" r="1.5" fill="currentColor" />
              <circle cx="13" cy="2" r="1.5" fill="currentColor" />
            </svg>
            <strong>{d.streak}</strong> day streak
          </p>
        </AppHeader>
        <div className="alpen-hero__level">
          <p className="alpen-hero__kicker">{levelTitle ?? 'Your climb'}</p>
          <p className="alpen-hero__number">Level {d.level.number}</p>
          <LevelBar d={d} theme={theme} />
          <p className="alpen-hero__hint">
            <LevelHint d={d} theme={theme} />
          </p>
        </div>
      </section>

      <div className="actions">
        <ActionLink to="/lessons" kind="lessons" count={d.lessonsAvailable}>
          <span className="action__label">Lessons</span>
          <span className="action__count">{d.lessonsAvailable}</span>
          <span className="action__sub">new words</span>
        </ActionLink>
        <ActionLink to="/reviews" kind="reviews" count={d.reviewsDue}>
          <span className="action__label">Reviews</span>
          <span className="action__count">{d.reviewsDue}</span>
          <span className="action__sub">due now</span>
        </ActionLink>
      </div>

      <EarlyStageWarning d={d} theme={theme} />
      <StoriesLink />

      <section className="stage-section">
        <div className="section-head">
          <h2>{theme.copy.stagesTitle}</h2>
          <span className="muted">{plural(wordCount(d), 'word')} on the trail</span>
        </div>
        <StageRows d={d} theme={theme} />
      </section>

      <p className="upcoming">
        <span>Next reviews</span>
        <span>
          <UpcomingLine d={d} now={now} />
        </span>
      </p>
    </main>
  );
}

/* Bauhaus: a block grid of primaries, and the stages as a workshop's ranks. */

export function BauhausDashboard({ d, now, theme, levelTitle }: LayoutProps) {
  return (
    <main className="page dash dash--bauhaus">
      <AppHeader className="app-header--ruled">
        <p className="header-note">level {String(d.level.number).padStart(2, '0')}</p>
      </AppHeader>

      <div className="bauhaus-grid">
        <ActionLink to="/reviews" kind="reviews" count={d.reviewsDue} className="bauhaus-grid__reviews">
          <span className="action__label">reviews</span>
          <span className="action__count">{d.reviewsDue}</span>
          <span className="action__sub">due now →</span>
        </ActionLink>
        <ActionLink to="/lessons" kind="lessons" count={d.lessonsAvailable} className="bauhaus-grid__lessons">
          <span className="bauhaus-grid__disc" aria-hidden="true" />
          <span className="action__count">{d.lessonsAvailable}</span>
          <span className="action__label">lessons</span>
        </ActionLink>
        <p className="bauhaus-grid__streak" title="Days in a row with a finished session">
          <strong>{d.streak}</strong> day streak
        </p>
      </div>

      <EarlyStageWarning d={d} theme={theme} />
      <StoriesLink />

      <section className="bauhaus-level">
        <div className="section-head">
          <h2>
            level {d.level.number}
            {levelTitle && <span className="muted"> · {levelTitle}</span>}
          </h2>
          <span className="muted">
            {d.level.known} / {d.level.needed}
          </span>
        </div>
        <LevelBar d={d} theme={theme} />
        <p className="muted small">
          <LevelHint d={d} theme={theme} />
        </p>
      </section>

      <section className="stage-section">
        <div className="section-head">
          <h2>{theme.copy.stagesTitle}</h2>
          <span className="muted">{plural(wordCount(d), 'word')}</span>
        </div>
        <StageRows d={d} theme={theme} bars />
      </section>

      <p className="upcoming">
        <span>next round</span>
        <span>
          <UpcomingLine d={d} now={now} />
        </span>
      </p>
    </main>
  );
}

/* Schwarz-Rot-Gold: a departure board. Reviews and lessons depart now; later batches are listed by time. */

export function BahnDashboard({ d, now, theme, levelTitle }: LayoutProps) {
  const later = upcomingBatches(d, 3);
  return (
    <main className="page dash dash--bahn">
      <AppHeader className="app-header--board" kicker="Abfahrt" name="Gipfel Hbf">
        <p className="board-clock" title="Days in a row with a finished session">
          <span className="board-clock__time">{clock(now)}</span>
          <span className="board-clock__streak">{plural(d.streak, 'day')} on time</span>
        </p>
      </AppHeader>

      <section className="board" aria-label="Departures">
        <div className="board__row board__row--head" aria-hidden="true">
          <span lang="de">Zeit</span>
          <span lang="de">Ziel</span>
          <span lang="de">Gleis</span>
        </div>
        <BoardLink to="/reviews" count={d.reviewsDue} title="Reviews" sub={`${plural(d.reviewsDue, 'word')} · all stages`} platform={1} />
        <BoardLink to="/lessons" count={d.lessonsAvailable} title="Lessons" sub={`${plural(d.lessonsAvailable, 'new word')} · level ${d.level.number}`} platform={2} />
        {later.map((b) => (
          <div key={b.hourStart} className="board__row board__row--later">
            <span className="board__time">{clock(b.hourStart)}</span>
            <span className="board__dest">
              <span className="board__title">Reviews</span>
              <span className="board__sub">+{plural(b.count, 'word')}</span>
            </span>
            <span className="board__platform board__platform--quiet">1</span>
          </div>
        ))}
        {later.length === 0 && <p className="board__empty">No further departures in the next 24 hours.</p>}
      </section>

      <EarlyStageWarning d={d} theme={theme} />
      <StoriesLink />

      <section className="card">
        <div className="card__head">
          <h2>
            Level {d.level.number}
            {levelTitle && <span className="muted"> · {levelTitle}</span>}
          </h2>
          <span className="muted">
            {d.level.known} / {d.level.needed} to level up
          </span>
        </div>
        <LevelBar d={d} theme={theme} />
        <p className="muted small">
          <LevelHint d={d} theme={theme} />
        </p>
      </section>

      <section className="stage-section">
        <div className="section-head">
          <h2>{theme.copy.stagesTitle}</h2>
          <span className="muted">{plural(wordCount(d), 'word')} en route</span>
        </div>
        <StageRows d={d} theme={theme} bars />
      </section>
    </main>
  );
}

function BoardLink({ to, count, title, sub, platform }: { to: string; count: number; title: string; sub: string; platform: number }) {
  return (
    <Link to={to} className={`board__row board__row--link${count === 0 ? ' is-empty' : ''}`}>
      <span className="board__time" lang="de">
        {count > 0 ? 'jetzt' : '—'}
      </span>
      <span className="board__dest">
        <span className="board__title">{title}</span>
        <span className="board__sub">{count > 0 ? sub : 'nothing waiting'}</span>
      </span>
      <span className="board__platform">{platform}</span>
    </Link>
  );
}

/* Backstube: a printed masthead, two loaves of buttons, and the stages on a shelf. */

const PRETZEL = (
  <svg className="brand__pretzel" viewBox="0 0 44 34" width="44" height="34" aria-hidden="true">
    <g fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 30 C 8 32, 2 22, 6 12 C 9 4, 18 4, 22 14 C 26 4, 35 4, 38 12 C 42 22, 36 32, 22 30 Z" />
      <path d="M14 26 L30 14 M30 26 L14 14" />
    </g>
  </svg>
);

export function BackstubeDashboard({ d, now, theme, levelTitle }: LayoutProps) {
  return (
    <main className="page dash dash--backstube">
      <AppHeader className="app-header--masthead" logo={PRETZEL} tagline="A bakery for German words" />

      <div className="actions actions--stacked">
        <ActionLink to="/reviews" kind="reviews" count={d.reviewsDue}>
          <span className="action__text">
            <span className="action__label">Reviews</span>
            <span className="action__sub">{d.reviewsDue > 0 ? 'Fresh from the oven, due now' : 'Nothing in the oven'}</span>
          </span>
          <span className="action__count">{d.reviewsDue}</span>
        </ActionLink>
        <ActionLink to="/lessons" kind="lessons" count={d.lessonsAvailable}>
          <span className="action__text">
            <span className="action__label">Lessons</span>
            <span className="action__sub">New dough for level {d.level.number}</span>
          </span>
          <span className="action__count">{d.lessonsAvailable}</span>
        </ActionLink>
      </div>

      <EarlyStageWarning d={d} theme={theme} />
      <StoriesLink />

      <section className="card">
        <div className="card__head">
          <h2>
            Level {d.level.number}
            {levelTitle && <span className="muted"> · {levelTitle}</span>}
          </h2>
          <span className="muted">
            {d.level.known} / {d.level.needed}
          </span>
        </div>
        <LevelBar d={d} theme={theme} />
        <p className="muted small">
          <LevelHint d={d} theme={theme} />
        </p>
      </section>

      <section className="stage-section">
        <div className="section-head">
          <h2>{theme.copy.stagesTitle}</h2>
          <span className="muted">
            {plural(wordCount(d), 'word')} · {plural(d.streak, 'day')} baked
          </span>
        </div>
        <StageRows d={d} theme={theme} />
      </section>

      <p className="upcoming">
        <em>Next tray</em>
        <span>
          <UpcomingLine d={d} now={now} />
        </span>
      </p>
    </main>
  );
}
