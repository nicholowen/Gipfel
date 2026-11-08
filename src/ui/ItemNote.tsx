import { useId, useState } from 'react';
import { repo, useNote } from '../data/instance';

const MAX_LENGTH = 500;

/**
 * The learner's own note on an item: shown under the mnemonic, added or edited in place.
 * Render it with key={itemId} so a half-written draft is dropped when the card changes.
 */
export function ItemNote({ itemId }: { itemId: string }) {
  const saved = useNote(itemId);
  const [draft, setDraft] = useState<string | null>(null);
  const fieldId = useId();

  if (saved === undefined) return null;

  if (draft === null) {
    return saved ? (
      <div className="info__note">
        <span className="info__label">My note</span>
        <p>{saved}</p>
        <button type="button" className="link-button" onClick={() => setDraft(saved)}>
          Edit note
        </button>
      </div>
    ) : (
      <button type="button" className="link-button info__add-note" onClick={() => setDraft('')}>
        + Add a note
      </button>
    );
  }

  const save = async () => {
    await repo.saveNote(itemId, draft);
    setDraft(null);
  };

  return (
    <form
      className="info__note"
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      <label className="info__label" htmlFor={fieldId}>
        My note
      </label>
      <textarea
        id={fieldId}
        className="note-field"
        value={draft}
        maxLength={MAX_LENGTH}
        rows={3}
        autoFocus
        placeholder="Your own memory trick, a usage tip, anything that helps."
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          // Keep keys inside the note from reaching the quiz or lesson around it.
          e.stopPropagation();
          if (e.key === 'Escape') setDraft(null);
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) void save();
        }}
      />
      <div className="row row--end">
        {saved && (
          <button
            type="button"
            className="link-button"
            onClick={async () => {
              await repo.saveNote(itemId, '');
              setDraft(null);
            }}
          >
            Delete
          </button>
        )}
        <button type="button" className="button button--quiet button--small" onClick={() => setDraft(null)}>
          Cancel
        </button>
        <button type="submit" className="button button--small">
          Save
        </button>
      </div>
    </form>
  );
}
