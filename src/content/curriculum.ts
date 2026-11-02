import base from '../../content/curriculum.json';
import level01 from '../../content/levels/level-01.json';
import level02 from '../../content/levels/level-02.json';
import type { ContentItem, Curriculum } from '../domain/types';

/** Add each new level file here as it is written. */
const levelFiles = [level01, level02] as unknown as ContentItem[][];

export const curriculum: Curriculum = {
  contentVersion: base.contentVersion,
  levels: base.levels,
  items: levelFiles.flat(),
};

export const itemsById = new Map(curriculum.items.map((i) => [i.id, i]));

export function getItem(id: string): ContentItem {
  const item = itemsById.get(id);
  if (!item) throw new Error(`Unknown item ${id}`);
  return item;
}

export const maxLevel = Math.max(...curriculum.levels.map((l) => l.number));
