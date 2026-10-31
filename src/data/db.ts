import Dexie, { type EntityTable } from 'dexie';
import type { ItemProgress, Stage } from '../domain/types';

export interface ReviewRecord {
  id?: number;
  itemId: string;
  at: number;
  meaningWrong: number;
  germanWrong: number;
  fromStage: Stage;
  toStage: Stage;
}

export interface Override {
  itemId: string;
  synonyms: string[];
  mnemonic?: string;
  note?: string;
}

export interface MetaRow {
  key: string;
  value: unknown;
}

export class GipfelDb extends Dexie {
  progress!: EntityTable<ItemProgress, 'itemId'>;
  reviews!: EntityTable<ReviewRecord, 'id'>;
  overrides!: EntityTable<Override, 'itemId'>;
  meta!: EntityTable<MetaRow, 'key'>;

  constructor(name = 'gipfel') {
    super(name);
    this.version(1).stores({
      progress: 'itemId, stage, nextReviewAt',
      reviews: '++id, itemId, at',
      overrides: 'itemId',
      meta: 'key',
    });
  }
}
