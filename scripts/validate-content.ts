import { curriculum } from '../src/content/curriculum';
import { validateCurriculum } from '../src/content/validate';

const problems = validateCurriculum(curriculum);

if (problems.length > 0) {
  console.error(`Content has ${problems.length} problem(s):`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

const counts = curriculum.levels.map((l) => `L${l.number}: ${curriculum.items.filter((i) => i.level === l.number).length}`);
console.log(`Content OK — ${curriculum.items.length} items (${counts.join(', ')})`);
