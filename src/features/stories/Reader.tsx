import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getItem } from '../../content/curriculum';
import { storiesById, storyTokens } from '../../content/stories';
import { repo, useKnownItems } from '../../data/instance';
import type { Token } from '../../domain/stories';
import { reportError } from '../../ui/errors';
import { GermanWord } from '../../ui/ItemInfo';
import { canSpeak, speak, speakLines, spokenForm } from '../../ui/speech';
import { PageBar } from '../lessons/Lessons';

type WordToken = Exclude<Token, { type: 'text' }>;

const lineText = (tokens: Token[]) => tokens.map((t) => t.text).join('');

/** One graded story: read along with audio, tap a word for its meaning, reveal English per line. */
export function Reader() {
  const { id = '' } = useParams();
  const story = storiesById.get(id);
  const known = useKnownItems();
  const [selected, setSelected] = useState<WordToken | null>(null);
  const [english, setEnglish] = useState<Set<number>>(new Set());
  const [allEnglish, setAllEnglish] = useState(false);
  const [playing, setPlaying] = useState(-1);
  const stop = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (story) repo.markStoryRead(story.id).catch(reportError);
    return () => stop.current?.();
  }, [story]);

  if (!story) {
    return (
      <main className="page centred">
        <h1>Story not found</h1>
        <Link to="/stories" className="button">
          All stories
        </Link>
      </main>
    );
  }
  if (!known) return null;

  const lines = storyTokens.get(story.id)!;
  const isKnown = (t: WordToken) => t.type === 'word' && t.itemIds.some((i) => known.has(i));

  const playAll = () => {
    if (playing >= 0) {
      stop.current?.();
      return;
    }
    stop.current = speakLines(lines.map(lineText), setPlaying);
  };

  const toggleLine = (i: number) =>
    setEnglish((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <main className={`page reader${selected ? ' has-sheet' : ''}`}>
      <PageBar title="Stories" back="/stories" backLabel="All stories" />

      <header className="reader__head">
        <h1 lang="de">{story.title}</h1>
        <p className="muted">{story.titleEn}</p>
        <div className="reader__tools">
          {canSpeak() && (
            <button type="button" className="button button--small" onClick={playAll}>
              {playing >= 0 ? 'Stop' : 'Read it to me'}
            </button>
          )}
          <label className="toggle">
            <input type="checkbox" checked={allEnglish} onChange={(e) => setAllEnglish(e.target.checked)} />
            <span>English</span>
          </label>
        </div>
      </header>

      <ol className={`reader__lines reader__lines--${story.kind}`}>
        {lines.map((tokens, i) => {
          const line = story.lines[i];
          const showEnglish = allEnglish || english.has(i);
          return (
            <li key={i} className={`reader__line${playing === i ? ' is-playing' : ''}`}>
              {line.speaker && <span className="reader__speaker">{line.speaker}</span>}
              <p className="reader__de" lang="de">
                {tokens.map((t, k) =>
                  t.type === 'text' ? (
                    <span key={k}>{t.text}</span>
                  ) : t.type === 'name' ? (
                    <span key={k}>{t.text}</span>
                  ) : (
                    <button
                      key={k}
                      type="button"
                      className={`reader__word${isKnown(t) ? '' : ' is-new'}${selected === t ? ' is-selected' : ''}`}
                      onClick={() => {
                        setSelected(t);
                        speak(t.text);
                      }}
                    >
                      {t.text}
                    </button>
                  ),
                )}
              </p>
              {showEnglish && <p className="reader__en">{line.en}</p>}
              <div className="reader__line-tools">
                {canSpeak() && (
                  <button type="button" className="link-button" onClick={() => speak(lineText(tokens))}>
                    Play
                  </button>
                )}
                {!allEnglish && (
                  <button type="button" className="link-button" onClick={() => toggleLine(i)} aria-expanded={showEnglish}>
                    {showEnglish ? 'Hide English' : 'English'}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <div className="row">
        <Link to="/stories" className="button button--quiet">
          All stories
        </Link>
      </div>

      {selected && <WordSheet token={selected} known={isKnown(selected)} onClose={() => setSelected(null)} />}
    </main>
  );
}

function WordSheet({ token, known, onClose }: { token: WordToken; known: boolean; onClose: () => void }) {
  const items = token.type === 'word' ? token.itemIds.map(getItem) : [];
  return (
    <aside className="word-sheet" aria-live="polite">
      <div className="word-sheet__head">
        <span className="word-sheet__word" lang="de">
          {token.text}
        </span>
        <button type="button" className="icon-button" onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      {token.type === 'gloss' && (
        <p>
          {token.gloss} <span className="muted small">· not in your lessons yet</span>
        </p>
      )}
      {items.map((item) => (
        <button key={item.id} type="button" className="word-sheet__item" onClick={() => speak(spokenForm(item))}>
          <GermanWord item={item} />
          <span>{item.meanings.slice(0, 3).join(' · ')}</span>
        </button>
      ))}
      {token.type === 'word' && !known && <p className="muted small">You are still learning this one.</p>}
    </aside>
  );
}
