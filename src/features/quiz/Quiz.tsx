import { useEffect, useMemo, useRef, useState } from 'react';
import { getItem } from '../../content/curriculum';
import { loadStages, useSettings, useSynonyms } from '../../data/instance';
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
import { useTheme } from '../../ui/theme-context';
import { stageLabel, type Theme } from '../../ui/themes';
import type { ContentItem, Stage } from '../../domain/types';

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
  const { theme } = useTheme();
  const [stages, setStages] = useState<Map<string, Stage>>(new Map());

  useEffect(() => {
    // Read once per session (the id list doesn't change), so labels show where each word started.
    loadStages(itemIds).then(setStages).catch(() => undefined);
  }, [itemIds]);

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

  // Queue finished: the parent is saving and will move on.
  if (!question || !item) return <p className="muted centred-text">Saving…</p>;

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

      <Prompt item={item} german={isGerman} theme={theme} stage={stages.get(item.id) ?? 0} />

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
              <strong className="notice__title" lang="de">
                {passed ? theme.copy.right : theme.copy.wrong}
              </strong>{' '}
              {shown.result.message && <span>{shown.result.message} </span>}
              {!passed && (
                <span>
                  Answer: <strong>{isGerman ? spokenForm(item) : item.meanings[0]}</strong>
                </span>
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

/** The question card. Every theme shares this markup; the Bahn theme spells German words on split-flap tiles. */
function Prompt({ item, german, theme, stage }: { item: ContentItem; german: boolean; theme: Theme; stage: Stage }) {
  const text = german ? item.meanings.join(', ') : item.german;
  const size = text.length > 14 ? ' prompt--longer' : text.length > 9 ? ' prompt--long' : '';
  const flaps = theme.id === 'bahn' && !german && item.german.length <= 12;

  return (
    <section className={`prompt prompt--${german ? 'german' : 'meaning'}${size}`}>
      {theme.id === 'alpen' && (
        <svg className="contours" viewBox="0 0 350 200" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
          <path d="M-10 190 C 60 160, 120 180, 190 140 S 300 100, 360 120" />
          <path d="M-10 165 C 70 135, 130 155, 200 115 S 300 75, 360 95" />
          <path d="M-10 140 C 80 110, 140 130, 210 92 S 300 52, 360 70" />
          <path d="M-10 115 C 90 88, 150 105, 220 70 S 300 32, 360 46" />
        </svg>
      )}
      {theme.id === 'bauhaus' && (
        <>
          <span className="prompt__disc" aria-hidden="true" />
          <span className="prompt__block" aria-hidden="true" />
        </>
      )}
      <div className="prompt__top">
        <span className="prompt__stage" lang="de">
          {stageLabel(theme, stage)}
        </span>
        <span className="prompt__label">{german ? 'German' : 'Meaning'}</span>
      </div>
      <div className="prompt__body">
        {!german && item.article && (
          <span className={`prompt__article prompt__article--${item.article}`} lang="de">
            {item.article}
          </span>
        )}
        {flaps ? (
          <p className="flaps" role="img" aria-label={item.german} lang="de">
            {[...item.german].map((ch, i) => (
              <span key={i} className={ch === ' ' ? 'flap flap--gap' : 'flap'} aria-hidden="true">
                {ch}
              </span>
            ))}
          </p>
        ) : (
          <p className="prompt__text" lang={german ? 'en' : 'de'}>
            {text}
          </p>
        )}
        <p className="prompt__hint" lang={german ? 'en' : 'de'}>
          {german ? (item.kind === 'noun' ? 'in German, with der, die or das' : 'in German') : item.example.de}
        </p>
      </div>
    </section>
  );
}
