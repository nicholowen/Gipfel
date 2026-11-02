import handschuh from '../../content/stories/s-der-handschuh.json';
import halloBen from '../../content/stories/s-hallo-ben.json';
import { buildLexicon, tokenizeStory, type Story, type Token } from '../domain/stories';
import { curriculum } from './curriculum';

/** Add each new story file here as it is written, in the order they should be listed. */
export const stories = [handschuh, halloBen] as unknown as Story[];

export const lexicon = buildLexicon(curriculum.items);

/** Every story, split into tokens once at startup. */
export const storyTokens: ReadonlyMap<string, Token[][]> = new Map(stories.map((s) => [s.id, tokenizeStory(s, lexicon)]));

export const storiesById = new Map(stories.map((s) => [s.id, s]));
