import { curriculum } from '../src/content/curriculum';
import { stories } from '../src/content/stories';
import { validateCurriculum, validateStories } from '../src/content/validate';
import { STORY_TARGET } from '../src/domain/stories';

const problems = validateCurriculum(curriculum);
const reports = validateStories(stories, curriculum);
for (const r of reports) problems.push(...r.problems.map((p) => `${r.id}: ${p}`));

if (problems.length > 0) {
  console.error(`Content has ${problems.length} problem(s):`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

const counts = curriculum.levels.map((l) => `L${l.number}: ${curriculum.items.filter((i) => i.level === l.number).length}`);
console.log(`Content OK — ${curriculum.items.length} items (${counts.join(', ')})`);
for (const r of reports) {
  const pct = `${(r.coverage * 100).toFixed(1)}%`;
  console.log(`  ${r.id}: ${pct} of words taught by its level${r.coverage < STORY_TARGET ? ` (below the ${STORY_TARGET * 100}% target)` : ''}`);
}
