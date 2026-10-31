export type ItemKind = 'noun' | 'verb' | 'adjective' | 'other';
export type Article = 'der' | 'die' | 'das';
export type QuestionType = 'meaning' | 'german';

export interface VerbForms {
  present3sg: string;
  pastParticiple: string;
  auxiliary: 'haben' | 'sein';
}

export interface ContentItem {
  /** Stable slug, never changes once published, e.g. 'n-handschuh'. */
  id: string;
  level: number;
  /** Position within the level. */
  order: number;
  kind: ItemKind;
  /** Lemma without article, e.g. 'Handschuh'. */
  german: string;
  /** Required for nouns. */
  article?: Article;
  /** null = the noun has no plural. */
  plural?: string | null;
  verbForms?: VerbForms;
  /** First entry is the primary meaning. */
  meanings: string[];
  /** Item ids that must reach Guru before this item unlocks. */
  prerequisites: string[];
  example: { de: string; en: string };
  mnemonic?: string;
}

export interface Level {
  number: number;
  title: string;
}

export interface Curriculum {
  contentVersion: number;
  levels: Level[];
  items: ContentItem[];
}

/** Stage 0 = unlocked, waiting in the lesson queue. 1–8 = in review. 9 = burned. */
export type Stage = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface ItemProgress {
  itemId: string;
  stage: Stage;
  unlockedAt: number;
  startedAt?: number;
  /** Epoch ms; null while in the lesson queue or once burned. */
  nextReviewAt: number | null;
  burnedAt?: number;
  correctCount: number;
  wrongCount: number;
}
