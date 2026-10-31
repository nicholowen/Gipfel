import { forwardRef, useImperativeHandle, useRef } from 'react';

const UMLAUTS = ['ä', 'ö', 'ü', 'ß'];

export type ResultState = 'idle' | 'correct' | 'wrong';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  german: boolean;
  result: ResultState;
  /** Increment to play the shake animation again. 0 = no shake. */
  shakeCount: number;
}

export interface AnswerInputHandle {
  focus: () => void;
}

export const AnswerInput = forwardRef<AnswerInputHandle, Props>(function AnswerInput(
  { value, onChange, onSubmit, german, result, shakeCount },
  ref,
) {
  const input = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => ({ focus: () => input.current?.focus() }));

  const insert = (ch: string) => {
    const el = input.current;
    if (!el || result !== 'idle') return;
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    onChange(value.slice(0, start) + ch + value.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + ch.length, start + ch.length);
    });
  };

  return (
    <form
      className="answer"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div className={`answer__field answer__field--${result} ${shakeCount === 0 ? '' : shakeCount % 2 ? 'shake-a' : 'shake-b'}`}>
        <input
          ref={input}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          readOnly={result !== 'idle'}
          placeholder={german ? 'Auf Deutsch…' : 'In English…'}
          lang={german ? 'de' : 'en'}
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          enterKeyHint={result === 'idle' ? 'done' : 'next'}
          aria-label={german ? 'Answer in German' : 'Answer in English'}
        />
        <button type="submit" className="answer__go" aria-label={result === 'idle' ? 'Check answer' : 'Next'}>
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      {german && (
        <div className="umlauts" aria-label="Special characters">
          {UMLAUTS.map((ch) => (
            <button
              key={ch}
              type="button"
              className="umlauts__key"
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => insert(ch)}
            >
              {ch}
            </button>
          ))}
        </div>
      )}
    </form>
  );
});
