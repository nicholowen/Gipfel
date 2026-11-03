import { useNavigate } from 'react-router-dom';
import { curriculum } from '../../content/curriculum';
import { repo, useDashboard, useIntroDone, useNow } from '../../data/instance';
import { reportError } from '../../ui/errors';
import { useTheme } from '../../ui/theme-context';
import { Intro } from '../onboarding/Intro';
import { AlpenDashboard, BackstubeDashboard, BahnDashboard, BauhausDashboard } from './layouts';
import { wordCount } from './parts';

const LAYOUTS = {
  alpen: AlpenDashboard,
  bauhaus: BauhausDashboard,
  bahn: BahnDashboard,
  backstube: BackstubeDashboard,
} as const;

/** The home screen. Each theme lays the same numbers out its own way (see layouts.tsx). */
export function Dashboard() {
  const now = useNow();
  const d = useDashboard(now);
  const introDone = useIntroDone();
  const { theme } = useTheme();
  const navigate = useNavigate();
  if (!d || introDone === undefined) return null;

  if (!introDone) {
    // A brand-new learner goes straight into their first lesson.
    const fresh = wordCount(d) === 0 && d.lessonsAvailable > 0;
    return (
      <Intro
        onFinish={() =>
          repo
            .completeIntro(Date.now())
            .then(() => fresh && navigate('/lessons'))
            .catch(reportError)
        }
      />
    );
  }

  const levelTitle = curriculum.levels.find((l) => l.number === d.level.number)?.title;
  const Layout = LAYOUTS[theme.id];
  return <Layout d={d} now={now} theme={theme} levelTitle={levelTitle} />;
}
