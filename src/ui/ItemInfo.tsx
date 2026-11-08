import type { ContentItem } from '../domain/types';
import { ItemNote } from './ItemNote';
import { canSpeak, speak, spokenForm } from './speech';

const KIND_LABEL = { noun: 'Noun', verb: 'Verb', adjective: 'Adjective', other: 'Word', phrase: 'Phrase' } as const;

const PERSONS = [
  ['ich', 'ich'],
  ['du', 'du'],
  ['er', 'er / sie / es'],
  ['wir', 'wir'],
  ['ihr', 'ihr'],
  ['sie', 'sie / Sie'],
] as const;

export function GermanWord({ item, size = 'md' }: { item: ContentItem; size?: 'md' | 'xl' }) {
  return (
    <span className={`word word--${size}`}>
      {item.article && <span className={`article article--${item.article}`}>{item.article} </span>}
      <span className={item.article ? `gender--${item.article}` : undefined}>{item.german}</span>
    </span>
  );
}

export function SpeakButton({ item }: { item: ContentItem }) {
  if (!canSpeak()) return null;
  return (
    <button type="button" className="icon-button" onClick={() => speak(spokenForm(item))} aria-label="Play pronunciation">
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
        <path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      </svg>
    </button>
  );
}

export function ItemInfo({ item, showWord = true }: { item: ContentItem; showWord?: boolean }) {
  return (
    <div className="info">
      {showWord && (
        <div className="info__head">
          <GermanWord item={item} size="xl" />
          <SpeakButton item={item} />
        </div>
      )}
      <dl className="info__facts">
        <div>
          <dt>Meaning</dt>
          <dd>{item.meanings.join(', ')}</dd>
        </div>
        <div>
          <dt>Type</dt>
          <dd>{KIND_LABEL[item.kind]}</dd>
        </div>
        {item.kind === 'noun' && (
          <div>
            <dt>Plural</dt>
            <dd>{item.plural ? `die ${item.plural}` : 'no plural'}</dd>
          </div>
        )}
        {item.alternatives && item.alternatives.length > 0 && (
          <div>
            <dt>Also</dt>
            <dd lang="de">{item.alternatives.join(' · ')}</dd>
          </div>
        )}
        {item.verbForms && (
          <>
            <div className="info__conjugation">
              <dt>Present</dt>
              <dd>
                <table className="conjugation" lang="de">
                  <tbody>
                    {PERSONS.map(([key, label]) => (
                      <tr key={key}>
                        <th scope="row">{label}</th>
                        <td>{item.verbForms!.present[key]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </dd>
            </div>
            <div>
              <dt>Perfect</dt>
              <dd>
                {item.verbForms.auxiliary === 'sein' ? 'ist' : 'hat'} {item.verbForms.pastParticiple}
              </dd>
            </div>
          </>
        )}
      </dl>
      <figure className="info__example">
        <blockquote lang="de">{item.example.de}</blockquote>
        <figcaption>{item.example.en}</figcaption>
      </figure>
      {item.mnemonic && (
        <p className="info__mnemonic">
          <span className="info__label">Mnemonic</span>
          {item.mnemonic}
        </p>
      )}
      <ItemNote key={item.id} itemId={item.id} />
    </div>
  );
}
