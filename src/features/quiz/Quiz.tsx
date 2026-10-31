import { useEffect, useMemo, useRef, useState } from 'react';
import { getItem } from '../../content/curriculum';
import { useSettings, useSynonyms } from '../../data/instance';
import { check, type CheckResult } from '../../domain/answer-checker';
import {
  answer,
  current,
  hasShaken,
  isFinished,
  settledItems,
  startSession,
  undo,
  wrapUp,
  type CompletedItem,
  type Question,
  type SessionState,
} from '../../domain/review-session';
import { AnswerInput, type AnswerInputHandle } from '../../ui/AnswerInput';
import { ItemInfo } from '../../ui/ItemInfo';
import { speak, spokenForm } from '../../ui/speech';

interface Props {
  itemIds: string[];
  /** Called with items that can no longer be undone, as soon as they settle. */
  onSettled?: (items: CompletedItem[]) => void;
  onFinished: (state: SessionState) => void;
  allowWrapUp?: boolean;
}

interface Shown {
  question: Question;
  result: CheckResult;
}

export function Quiz({ itemIds, onSettled, onFinished, allowWrapUp = false }: Props) {
  const [state, setState] = useState(() => startSession(itemIds, Math.random));
  const [input, setInput] = useState('');
  const [shown, setShown] = useState<Shown | null>(null);
  const [shake, setShake] = useState<{ message?: string; n: number } | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [wrappingUp, setWrappingUp] = useState(false);
  const field = useRef<AnswerInputHandle>(null);
  const reported = useRef(0);
  const settings = useSettings();

  const question = shown?.question ?? current(state);
  const item = question ? getItem(question.itemId) : undefined;
  const synonyms = useSynonyms(item?.id);

  // Report items as they settle (no longer undoable).
  useEffect(() => {
    const settled = settledItems(state);
    if (onSettled && settled.length > reported.current) {
      onSettled(settled.slice(reported.current));
      reported.current = settled.length;
    }
  }, [state, onSettled]);

  useEffect(() => {
    if (!shown) field.current?.focus();
  }, [shown, question]);

  const total = itemIds.length;
  const stats = useMemo(() => {
    const t = Object.values(state.tallies);
    const answered = t.reduce((n, x) => n + Number(x.meaningDone) + Number(x.germanDone) + x.meaningWrong + x.germanWrong, 0);
    const wrong = t.reduce((n, x) => n + x.meaningWrong + x.germanWrong, 0);
    return { done: state.completed.length, accuracy: answered === 0 ? null : Math.round(((answered - wrong) / answered) * 100) };
  }, [state]);

  if (!question || !item) return null;

  const finishIfDone = (next: SessionState) => {
    if (isFinished(next)) {
      if (onSettled) {
        const rest = settledItems(next, { final: true }).slice(reported.current);
        if (rest.length > 0) onSettled(rest);
        reported.current += rest.length;
      }
      onFinished(next);
    }
  };

  const submit = () => {
    if (shown) {
      // Advance to the next question.
      setShown(null);
      setInput('');
      setInfoOpen(false);
      finishIfDone(state);
      return;
    }
    const result = check(item, question.type, input, { synonyms, shookAlready: hasShaken(state, question) });
    if (result.outcome === 'shake') {
      setShake((s) => ({ message: result.message, n: (s?.n ?? 0) + 1 }));
      setState((s) => answer(s, 'shake', Math.random));
      return;
    }
    setShake(null);
    setState((s) => answer(s, result.outcome, Math.random));
    setShown({ question, result });
    if (result.outcome === 'wrong') setInfoOpen(true);
    if (question.type === 'german' && settings.autoplayAudio) speak(spokenForm(item));
  };

  const undoLast = () => {
    setState((s) => undo(s));
    setShake(null);
    setShown(null);
    setInfoOpen(false);
  };

  const passed = shown && shown.result.outcome !== 'wrong';
  const isGerman = question.type === 'german';

  return (
    <div className="quiz">
      <div className="quiz__bar">
        <span>
          {stats.done} / {total} done
        </span>
        {stats.accuracy !== null && <span>{stats.accuracy}% right</span>}
        {allowWrapUp && !wrappingUp && (
          <button
            type="button"
            className="link-button"
            onClick={() => {
              setWrappingUp(true);
              const next = wrapUp(state);
              setState(next);
              if (!shown) finishIfDone(next);
            }}
          >
            Wrap up
          </button>
        )}
      </div>
      <div className="quiz__progress" aria-hidden="true">
        <span style={{ width: `${(stats.done / total) * 100}%` }} />
      </div>

      <section className={`prompt prompt--${question.type}`}>
        <p className="prompt__label">{isGerman ? 'German' : 'Meaning'}</p>
        <p className="prompt__text" lang={isGerman ? 'en' : 'de'}>
          {isGerman ? item.meanings.join(', ') : item.german}
        </p>
        <p className="prompt__hint">{isGerman ? (item.kind === 'noun' ? 'with der, die or das' : ' ') : 'in English'}</p>
      </section>

      <AnswerInput
        key={`${question.itemId}:${question.type}:${stats.done}`}
        ref={field}
        value={input}
        onChange={setInput}
        onSubmit={submit}
        german={isGerman}
        result={shown ? (passed ? 'correct' : 'wrong') : 'idle'}
        shakeCount={shown ? 0 : (shake?.n ?? 0)}
      />
      <div className="quiz__feedback" aria-live="polite">
        {shake && !shown && <p className="notice notice--shake">{shake.message}</p>}
        {shown && (
          <>
            <p className={`notice ${passed ? 'notice--good' : 'notice--bad'}`}>
              {shown.result.message ?? (passed ? 'Richtig!' : 'Not quite.')}{' '}
              {!passed && (
                <>
                  Answer: <strong>{isGerman ? spokenForm(item) : item.meanings[0]}</strong>
                </>
              )}
            </p>
            <div className="quiz__actions">
              <button type="button" className="link-button" onClick={undoLast}>
                Undo
              </button>
              <button type="button" className="link-button" onClick={() => setInfoOpen((o) => !o)}>
                {infoOpen ? 'Hide info' : 'Show info'}
              </button>
              <button type="button" className="button button--small" onClick={submit}>
                Next
              </button>
            </div>
          </>
        )}
      </div>
      {shown && infoOpen && <ItemInfo item={item} />}
    </div>
  );
}
