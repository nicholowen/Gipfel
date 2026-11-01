import { curriculum } from '../../content/curriculum';
import { useDashboard, useNow } from '../../data/instance';
import { useTheme } from '../../ui/theme-context';
import { AlpenDashboard, BackstubeDashboard, BahnDashboard, BauhausDashboard } from './layouts';

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
  const { theme } = useTheme();
  if (!d) return null;

  const levelTitle = curriculum.levels.find((l) => l.number === d.level.number)?.title;
  const Layout = LAYOUTS[theme.id];
  return <Layout d={d} now={now} theme={theme} levelTitle={levelTitle} />;
}
