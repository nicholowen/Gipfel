import { Link } from 'react-router-dom';
import { curriculum } from '../../content/curriculum';
import { useDashboard, useNow } from '../../data/instance';
import { APPRENTICE_WARNING } from '../../domain/dashboard';
import { AppHeader } from '../../ui/AppHeader';
import { useTheme } from '../../ui/theme-context';
import { STAGE_KEYS } from '../../ui/themes';

const time = (ms: number) => new Date(ms).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

function relative(ms: number, now: number): string {
  const mins = Math.round((ms - now) / 60_000);
  if (mins < 60) return `in ${Math.max(1, mins)} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `in ${hours} h`;
  const days = Math.round(hours / 24);
  return `in ${days} day${days === 1 ? '' : 's'}`;
}

export function Dashboard() {
  const now = useNow();
  const d = useDashboard(now);
  const { theme } = useTheme();
  if (!d) return null;
  const stage = theme.stages;

  const levelTitle = curriculum.levels.find((l) => l.number === d.level.number)?.title;
  const { total, atGuru, needed } = d.level;
  const peak = Math.max(1, ...d.forecast.map((b) => b.count));
  const upcoming = d.forecast.reduce((n, b) => n + b.count, 0);

  return (
    <main className="page dashboard">
      <AppHeader>
        <p className="streak" title="Days in a row with a finished session">
          <strong>{d.streak}</strong> day streak
        </p>
      </AppHeader>

      <div className="actions">
        <Link to="/lessons" className={`action action--lessons${d.lessonsAvailable === 0 ? ' is-empty' : ''}`}>
          <span className="action__count">{d.lessonsAvailable}</span>
          <span className="action__label">Lessons</span>
        </Link>
        <Link to="/reviews" className={`action action--reviews${d.reviewsDue === 0 ? ' is-empty' : ''}`}>
          <span className="action__count">{d.reviewsDue}</span>
          <span className="action__label">Reviews</span>
        </Link>
      </div>

      {d.apprenticeWarning && (
        <p className="notice notice--shake">
          Over {APPRENTICE_WARNING} words are in <span lang="de">{stage.apprentice.de}</span>. Clear some reviews before starting new lessons.
        </p>
      )}

      <section className="card">
        <div className="card__head">
          <h2>
            Level {d.level.number}
            {levelTitle && <span className="muted"> · {levelTitle}</span>}
          </h2>
          <span className="muted">
            {atGuru} / {needed} to level up
          </span>
        </div>
        <div className="level-bar" role="img" aria-label={`${atGuru} of ${total} words at ${stage.guru.de}; ${needed} needed`}>
          <span className="level-bar__fill" style={{ width: `${(atGuru / Math.max(1, total)) * 100}%` }} />
          <span className="level-bar__goal" style={{ left: `${(needed / Math.max(1, total)) * 100}%` }} />
        </div>
        <p className="muted small">A word reaches <span lang="de">{stage.guru.de}</span> after about four days of correct reviews.</p>
      </section>

      <section className="card">
        <div className="card__head">
          <h2>Next 24 hours</h2>
          <span className="muted">
            {d.nextReviewAt ? `next ${relative(d.nextReviewAt, now)} · ${time(d.nextReviewAt)}` : 'nothing scheduled'}
          </span>
        </div>
        {upcoming > 0 ? (
          <div className="forecast" role="img" aria-label={`${upcoming} reviews due in the next 24 hours`}>
            {d.forecast.map((b, i) => (
              <div key={b.hourStart} className="forecast__col">
                <span className="forecast__bar" style={{ height: `${(b.count / peak) * 100}%` }}>
                  {b.count > 0 && <em>{b.count}</em>}
                </span>
                <span className="forecast__tick">{i % 6 === 0 ? new Date(b.hourStart).toLocaleTimeString([], { hour: 'numeric' }) : ''}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted small">No reviews coming up in the next day.</p>
        )}
      </section>

      <section className="stages">
        {STAGE_KEYS.map((key, i) => (
          <div key={key} className={`stage stage--${i + 1}`} title={`${stage[key].de} (${stage[key].en})`}>
            <span className="stage__count">{d.groups[key]}</span>
            <span className="stage__label" lang="de">
              {stage[key].de}
            </span>
          </div>
        ))}
      </section>
    </main>
  );
}
