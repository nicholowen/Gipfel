import { z } from 'zod';
import type { Curriculum } from '../domain/types';

const itemSchema = z
  .object({
    id: z.string().regex(/^[noav]-[a-z0-9-]+$/, 'ids look like n-hund, v-gehen, a-gut, o-ja'),
    level: z.number().int().positive(),
    order: z.number().int().positive(),
    kind: z.enum(['noun', 'verb', 'adjective', 'other']),
    german: z.string().min(1),
    article: z.enum(['der', 'die', 'das']).optional(),
    plural: z.string().min(1).nullable().optional(),
    verbForms: z
      .object({
        present3sg: z.string().min(1),
        pastParticiple: z.string().min(1),
        auxiliary: z.enum(['haben', 'sein']),
      })
      .optional(),
    meanings: z.array(z.string().min(1)).min(1),
    prerequisites: z.array(z.string()),
    example: z.object({ de: z.string().min(1), en: z.string().min(1) }),
    mnemonic: z.string().min(1).optional(),
  })
  .strict()
  .superRefine((item, ctx) => {
    const issue = (message: string) => ctx.addIssue({ code: 'custom', message: `${item.id}: ${message}` });
    if (item.kind === 'noun' && !item.article) issue('nouns need an article');
    if (item.kind === 'noun' && item.plural === undefined) issue('nouns need a plural (or null)');
    if (item.kind !== 'noun' && item.article) issue('only nouns take an article');
    if (item.kind === 'verb' && !item.verbForms) issue('verbs need verbForms');
    const prefix = { noun: 'n-', verb: 'v-', adjective: 'a-', other: 'o-' }[item.kind];
    if (!item.id.startsWith(prefix)) issue(`id should start with ${prefix}`);
  });

export const curriculumSchema = z.object({
  contentVersion: z.number().int().positive(),
  levels: z.array(z.object({ number: z.number().int().positive(), title: z.string().min(1) })).min(1),
  items: z.array(itemSchema),
});

/** Returns a list of problems; empty means the curriculum is valid. */
export function validateCurriculum(input: unknown): string[] {
  const parsed = curriculumSchema.safeParse(input);
  if (!parsed.success) return parsed.error.issues.map((i) => `${i.path.join('.')} ${i.message}`.trim());
  const c = parsed.data as Curriculum;
  const problems: string[] = [];
  const byId = new Map(c.items.map((i) => [i.id, i]));
  const levels = new Set(c.levels.map((l) => l.number));

  if (byId.size !== c.items.length) {
    const seen = new Set<string>();
    for (const i of c.items) {
      if (seen.has(i.id)) problems.push(`${i.id}: duplicate id`);
      seen.add(i.id);
    }
  }

  for (const item of c.items) {
    if (!levels.has(item.level)) problems.push(`${item.id}: level ${item.level} is not in curriculum.json`);
    for (const p of item.prerequisites) {
      const pre = byId.get(p);
      if (!pre) problems.push(`${item.id}: prerequisite ${p} does not exist`);
      else if (pre.level > item.level) problems.push(`${item.id}: prerequisite ${p} is in a later level`);
    }
  }

  const orders = new Set<string>();
  for (const item of c.items) {
    const k = `${item.level}:${item.order}`;
    if (orders.has(k)) problems.push(`${item.id}: order ${item.order} is used twice in level ${item.level}`);
    orders.add(k);
  }

  // Prerequisite cycles (depth-first search).
  const state = new Map<string, 'visiting' | 'done'>();
  const visit = (id: string, path: string[]): void => {
    if (state.get(id) === 'done') return;
    if (state.get(id) === 'visiting') {
      problems.push(`prerequisite cycle: ${[...path, id].join(' → ')}`);
      return;
    }
    state.set(id, 'visiting');
    for (const p of byId.get(id)?.prerequisites ?? []) if (byId.has(p)) visit(p, [...path, id]);
    state.set(id, 'done');
  };
  for (const id of byId.keys()) visit(id, []);

  return problems;
}
