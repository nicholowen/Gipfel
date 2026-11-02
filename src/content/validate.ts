import { z } from 'zod';
import { buildLexicon, coverage, STORY_UNLOCK, tokenizeStory, type Story } from '../domain/stories';
import type { Curriculum } from '../domain/types';

const itemSchema = z
  .object({
    id: z.string().regex(/^[noavp]-[a-z0-9-]+$/, 'ids look like n-hund, v-gehen, a-gut, o-ja, p-wie-gehts'),
    level: z.number().int().positive(),
    order: z.number().int().positive(),
    kind: z.enum(['noun', 'verb', 'adjective', 'other', 'phrase']),
    german: z.string().min(1),
    alternatives: z.array(z.string().min(1)).optional(),
    forms: z.array(z.string().min(1)).optional(),
    article: z.enum(['der', 'die', 'das']).optional(),
    plural: z.string().min(1).nullable().optional(),
    verbForms: z
      .object({
        present: z
          .object({
            ich: z.string().min(1),
            du: z.string().min(1),
            er: z.string().min(1),
            wir: z.string().min(1),
            ihr: z.string().min(1),
            sie: z.string().min(1),
          })
          .strict(),
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
    const prefix = { noun: 'n-', verb: 'v-', adjective: 'a-', other: 'o-', phrase: 'p-' }[item.kind];
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

const storySchema = z
  .object({
    id: z.string().regex(/^s-[a-z0-9-]+$/, 'story ids look like s-der-handschuh'),
    title: z.string().min(1),
    titleEn: z.string().min(1),
    level: z.number().int().positive(),
    kind: z.enum(['story', 'dialogue']),
    names: z.array(z.string().min(1)).optional(),
    lines: z
      .array(z.object({ speaker: z.string().min(1).optional(), de: z.string().min(1), en: z.string().min(1) }).strict())
      .min(1),
  })
  .strict();

export interface StoryReport {
  id: string;
  /** Share of words known once every item up to the story's level is known. */
  coverage: number;
  problems: string[];
}

/** Checks each story's shape, that every word resolves, and that it is readable at its level. */
export function validateStories(input: unknown[], c: Curriculum): StoryReport[] {
  const lexicon = buildLexicon(c.items);
  const levels = new Set(c.levels.map((l) => l.number));
  const ids = new Set<string>();
  return input.map((raw, n) => {
    const parsed = storySchema.safeParse(raw);
    if (!parsed.success) {
      return { id: `story #${n + 1}`, coverage: 0, problems: parsed.error.issues.map((i) => `${i.path.join('.')} ${i.message}`.trim()) };
    }
    const story = parsed.data as Story;
    const problems: string[] = [];
    if (ids.has(story.id)) problems.push('duplicate story id');
    ids.add(story.id);
    if (!levels.has(story.level)) problems.push(`level ${story.level} is not in curriculum.json`);

    const lines = tokenizeStory(story, lexicon);
    lines.forEach((tokens, i) => {
      for (const t of tokens) {
        if (t.type !== 'unresolved') continue;
        problems.push(
          t.candidates.length > 1
            ? `line ${i + 1}: "${t.text}" could be ${t.candidates.join(' or ')}; annotate it, e.g. ${t.text}{${t.candidates[0]}}`
            : `line ${i + 1}: "${t.text}" is not a taught word; add it to a level, or gloss it as ${t.text}{?meaning}, or mark a name as ${t.text}{-}`,
        );
      }
    });

    const levelOf = new Map(c.items.map((i) => [i.id, i.level]));
    const cov = coverage(lines, (id) => (levelOf.get(id) ?? Infinity) <= story.level).ratio;
    if (cov < STORY_UNLOCK) {
      problems.push(`only ${(cov * 100).toFixed(1)}% of words are taught by level ${story.level}; needs ${STORY_UNLOCK * 100}%`);
    }
    return { id: story.id, coverage: cov, problems };
  });
}
