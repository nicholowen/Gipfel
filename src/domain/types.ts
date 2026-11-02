export type ItemKind = 'noun' | 'verb' | 'adjective' | 'other' | 'phrase';
export type Article = 'der' | 'die' | 'das';
export type QuestionType = 'meaning' | 'german';

/** Present tense, by person. `er` covers er/sie/es; `sie` covers sie (they) and Sie. */
export interface PresentForms {
  ich: string;
  du: string;
  er: string;
  wir: string;
  ihr: string;
  sie: string;
}

export interface VerbForms {
  present: PresentForms;
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
  /** Lemma without article, e.g. 'Handschuh'. For phrases, the whole phrase: 'Wie geht's?'. */
  german: string;
  /** Other German answers accepted in reviews, e.g. 'Wie geht es dir?' for 'Wie geht's?'. */
  alternatives?: string[];
  /** Extra word forms that count as this item when reading stories, e.g. 'eine', 'einen' for 'ein'. */
  forms?: string[];
  /** Required for nouns. */
  article?: Article;
  /** null = the noun has no plural. */
  plural?: string | null;
  verbForms?: VerbForms;
  /** First entry is the primary meaning. */
  meanings: string[];
  /** Item ids that must reach the known stage (5) before this item unlocks. */
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

/** Stage 0 = unlocked, waiting in the lesson queue. 1–8 = in review. 9 = final (learned for good). */
export type Stage = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface ItemProgress {
  itemId: string;
  stage: Stage;
  unlockedAt: number;
  startedAt?: number;
  /** Epoch ms; null while in the lesson queue or once at the final stage. */
  nextReviewAt: number | null;
  finishedAt?: number;
  correctCount: number;
  wrongCount: number;
}
