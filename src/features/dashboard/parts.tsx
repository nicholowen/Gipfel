import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useHintsSeen, useStories, type useDashboard } from '../../data/instance';
import { dashboardHint } from '../../domain/onboarding';
import { DAILY_NEW_ITEMS, EARLY_STAGE_LIMIT } from '../../domain/pacing';
import { Hint, useOneTimeHint } from '../../ui/Hint';
import { STAGE_INTERVAL, STAGE_KEYS, type StageKey, type Theme, type ThemeId } from '../../ui/themes';

export type DashboardData = NonNullable<ReturnType<typeof useDashboard>>;

export interface LayoutProps {
  d: DashboardData;
  now: number;
  theme: Theme;
  levelTitle?: string;
}

/** 24-hour clock time, as on a German timetable. */
export const clock = (ms: number) => new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

export function relative(ms: number, now: number): string {
  const mins = Math.round((ms - now) / 60_000);
  if (mins < 60) return `in ${Math.max(1, mins)} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `in ${hours} h`;
  const days = Math.round(hours / 24);
  return `in ${days} day${days === 1 ? '' : 's'}`;
}

/** The next few hours that have reviews arriving, soonest first. */
export function upcomingBatches(d: DashboardData, max: number) {
  return d.forecast.filter((b) => b.count > 0).slice(0, max);
}

export const wordCount = (d: DashboardData) => STAGE_KEYS.reduce((n, k) => n + d.groups[k], 0);

/** Stage groups from the last (top of the mountain) to the first. */
export const STAGES_TOP_DOWN: readonly StageKey[] = [...STAGE_KEYS].reverse();

export function ActionLink({
  to,
  kind,
  count,
  className = '',
  children,
}: {
  to: string;
  kind: 'lessons' | 'reviews';
  count: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link to={to} className={`action action--${kind}${count === 0 ? ' is-empty' : ''} ${className}`}>
      {children}
    </Link>
  );
}

/** Why the lessons button is empty, when it's because of pacing rather than running out. */
export function LessonPauseNotice({ d, theme }: { d: DashboardData; theme: Theme }) {
  if (d.lessonPause === 'busy') {
    return (
      <p className="notice notice--shake">
        {EARLY_STAGE_LIMIT} words are in <span lang="de">{theme.stages[1].de}</span>. New lessons pause until some move up.
      </p>
    );
  }
  return null;
}

/** Subtitle for the lessons button: the theme's own wording, or why there are none today. */
export function lessonSub(d: DashboardData, usual: string): string {
  if (d.lessonPause === 'daily') return `today’s ${DAILY_NEW_ITEMS} done · more tomorrow`;
  if (d.lessonPause === 'empty') return 'all caught up';
  return usual;
}

export function LevelBar({ d, theme }: { d: DashboardData; theme: Theme }) {
  const { total, known, needed } = d.level;
  return (
    <div className="level-bar" role="img" aria-label={`${known} of ${total} words at ${theme.stages[2].de}; ${needed} needed to level up`}>
      <span className="level-bar__fill" style={{ width: `${(known / Math.max(1, total)) * 100}%` }} />
      <span className="level-bar__goal" style={{ left: `${(needed / Math.max(1, total)) * 100}%` }} />
    </div>
  );
}

/** "4 more words need to reach Alm to level up" */
export function LevelHint({ d, theme }: { d: DashboardData; theme: Theme }) {
  const left = Math.max(0, d.level.needed - d.level.known);
  if (left === 0) return <>Ready to level up</>;
  return (
    <>
      {left} more word{left === 1 ? '' : 's'} need to reach <span lang="de">{theme.stages[2].de}</span> to level up
    </>
  );
}

/** "next in 25 min · +12, then 17:00 · +9" */
export function UpcomingLine({ d, now }: { d: DashboardData; now: number }) {
  const [first, second] = upcomingBatches(d, 2);
  if (!d.nextReviewAt || !first) return <>Nothing scheduled</>;
  return (
    <>
      {relative(d.nextReviewAt, now)} · <strong>+{first.count}</strong>
      {second && (
        <span className="upcoming__then">
          , then {clock(second.hourStart)} · +{second.count}
        </span>
      )}
    </>
  );
}

/** The five stage groups as a list, top stage first. */
export function StageRows({ d, theme, bars = false }: { d: DashboardData; theme: Theme; bars?: boolean }) {
  const peak = Math.max(1, ...STAGE_KEYS.map((k) => d.groups[k]));
  return (
    <ul className="stage-rows">
      {STAGES_TOP_DOWN.map((key) => {
        const n = STAGE_KEYS.indexOf(key) + 1;
        return (
          <li key={key} className={`stage-row stage-row--${n}`}>
            <StageIcon theme={theme.id} stage={key} />
            <span className="stage-row__text">
              <span className="stage-row__name" lang="de">
                {theme.stages[key].de}
              </span>
              <span className="stage-row__gloss">
                {theme.stages[key].en} · {key === 1 && wordCountIn(d, 1) > 0 ? <EarlySteps d={d} /> : STAGE_INTERVAL[key]}
              </span>
            </span>
            {bars && (
              <span className="stage-row__bar" aria-hidden="true">
                <span style={{ width: `${(d.groups[key] / peak) * 100}%` }} />
              </span>
            )}
            <span className="stage-row__count">{d.groups[key]}</span>
          </li>
        );
      })}
    </ul>
  );
}

const wordCountIn = (d: DashboardData, key: StageKey) => d.groups[key];

/** The first group's four steps (4 h, 8 h, 1 day, 2 days), so early progress is visible every day. */
function EarlySteps({ d }: { d: DashboardData }) {
  const label = d.earlySteps.map((n, i) => `${n} at step ${i + 1}`).join(', ');
  return (
    <span className="early-steps" role="img" aria-label={label} title={`Steps 1–4 of 4: ${label}`}>
      {d.earlySteps.map((n, i) => (
        <span key={i} className={`early-steps__step early-steps__step--${i + 1}${n === 0 ? ' is-empty' : ''}`}>
          {n}
        </span>
      ))}
    </span>
  );
}

const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

/** A small picture for each stage, drawn to suit the theme. */
export function StageIcon({ theme, stage }: { theme: ThemeId; stage: StageKey }) {
  const n = STAGE_KEYS.indexOf(stage) + 1;
  const box = (child: ReactNode, vb = '0 0 24 24') => (
    <span className={`stage-icon stage-icon--${n}`} aria-hidden="true">
      <svg viewBox={vb} width="20" height="20">
        {child}
      </svg>
    </span>
  );

  if (theme === 'alpen') {
    switch (stage) {
      case 1:
        return box(<path d="M2 15 C7 8, 17 8, 22 15" {...stroke} />);
      case 2:
        return box(
          <>
            <path d="M2 16 C7 9, 12 13, 22 6" {...stroke} />
            <path d="M6 20v-4M12 20v-5M18 20v-7" {...stroke} />
          </>,
        );
      case 3:
        return box(
          <>
            <path d="M3 11 L12 3 L21 11 V21 H3 Z" {...stroke} />
            <path d="M10 21 V15 H14 V21" {...stroke} />
          </>,
        );
      case 4:
        // The red-white-red trail marker.
        return (
          <span className="stage-icon stage-icon--waymark" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        );
      case 5:
        return box(<path d="M2 21 L12 4 L22 21 Z" fill="currentColor" />);
    }
  }

  if (theme === 'bauhaus') {
    switch (stage) {
      case 1:
        return box(<path d="M3 21 L12 4 L21 21 Z" fill="none" stroke="currentColor" strokeWidth="2.5" />);
      case 2:
        return box(<path d="M2 22 L12 3 L22 22 Z" fill="var(--stage-2)" />);
      case 3:
        return box(<rect x="3" y="3" width="18" height="18" fill="var(--stage-3)" />);
      case 4:
        return box(<circle cx="12" cy="12" r="10" fill="var(--stage-4)" />);
      case 5:
        return box(
          <>
            <circle cx="8" cy="16" r="7" fill="var(--stage-4)" />
            <rect x="11" y="1" width="12" height="12" fill="var(--stage-3)" />
            <path d="M12 24 L18 13 L24 24 Z" fill="var(--stage-2)" />
          </>,
        );
    }
  }

  if (theme === 'backstube') {
    switch (stage) {
      case 1:
        return box(
          <>
            <path d="M7 3 H17 L19 21 H5 Z" {...stroke} />
            <path d="M9 11 C11 9, 13 13, 15 11" {...stroke} />
          </>,
        );
      case 2:
        return box(
          <>
            <path d="M4 16 C2 11, 8 8, 12 9.5 C16 7, 23 10, 20 16 Z" {...stroke} />
            <path d="M2 18 H22" {...stroke} />
          </>,
        );
      case 3:
        return box(
          <>
            <path d="M4 14 C4 6, 20 6, 20 14 Z" {...stroke} />
            <path d="M2 14 H22 L19 20 H5 Z" {...stroke} />
          </>,
        );
      case 4:
        return box(
          <>
            <path d="M3 21 V9 C3 4, 21 4, 21 9 V21 Z" {...stroke} />
            <path d="M8 21 V15 C8 12, 16 12, 16 15 V21" {...stroke} />
          </>,
        );
      case 5:
        return box(
          <>
            <path d="M12 21 C3 22, 0 15, 3 9 C5 4, 10 4, 12 10 C14 4, 19 4, 21 9 C24 15, 21 22, 12 21 Z" {...stroke} strokeWidth="2.2" />
            <path d="M7 18 L17 10 M17 18 L7 10" {...stroke} strokeWidth="2.2" />
          </>,
        );
    }
  }

  // Schwarz-Rot-Gold: a coloured line badge, like a train category.
  return <span className={`stage-icon stage-icon--badge stage-icon--${n}`} aria-hidden="true" />;
}

/** The way into the graded stories, with how many can be read now. */
export function StoriesLink() {
  const all = useStories();
  if (!all || all.length === 0) return null;
  const ready = all.filter((s) => s.ready);
  const fresh = ready.filter((s) => !s.read).length;
  const next = all.find((s) => !s.ready);
  const sub =
    ready.length > 0
      ? `${ready.length} ready to read${fresh > 0 ? ` · ${fresh} new` : ''}`
      : next
        ? `First story at ${Math.floor(next.coverage.ratio * 100)}% of its words known`
        : '';
  return (
    <Link to="/stories" className={`stories-link${fresh > 0 ? ' has-new' : ''}`}>
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <path d="M3 5c3-1 6-1 9 1 3-2 6-2 9-1v14c-3-1-6-1-9 1-3-2-6-2-9-1z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M12 6v14" stroke="currentColor" strokeWidth="1.8" />
      </svg>
      <span className="stories-link__text">
        <span className="stories-link__title">Stories</span>
        <span className="stories-link__sub">{sub}</span>
      </span>
      <span aria-hidden="true">→</span>
    </Link>
  );
}

/** The one home-screen hint due now (see onboarding.ts), shown under the stage list. */
export function DashboardHint({ d }: { d: DashboardData }) {
  const seen = useHintsSeen();
  const id =
    seen === undefined
      ? null
      : dashboardHint(
          {
            first: d.groups[1],
            second: d.groups[2],
            known: d.groups[2] + d.groups[3] + d.groups[4] + d.groups[5],
            scheduled: d.nextReviewAt !== null || d.reviewsDue > 0,
          },
          seen,
        );
  const { show, dismiss } = useOneTimeHint(id, id !== null);
  return <Hint id={id} show={show} onDismiss={dismiss} />;
}
