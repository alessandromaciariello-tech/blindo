import { Fragment, useMemo, useState } from 'react';
import { progress, randomWords } from '../lib/challenge';

interface Props {
  count: number;
  onDone: () => void;
}

const block = (e: React.SyntheticEvent) => e.preventDefault();

export function WordChallenge({ count, onDone }: Props) {
  const words = useMemo(() => randomWords(count), [count]);
  const [input, setInput] = useState('');
  const p = progress(words, input);

  const onChange = (value: string) => {
    setInput(value);
    if (progress(words, value).done) onDone();
  };

  return (
    <div className="challenge">
      <div className="challenge-head">
        <span className="mono">{p.words} / {count}</span>
        <span className="muted small">parole</span>
      </div>
      <div className="progress"><span style={{ width: `${(p.words / count) * 100}%` }} /></div>

      <p className="words" onCopy={block} onContextMenu={block} aria-label="Parole da digitare">
        {words.map((w, idx) => (
          <Fragment key={idx}>
            <span
              className={idx < p.words ? 'w done' : idx === p.words ? 'w now' : 'w'}
              ref={idx === p.words ? (el) => el?.scrollIntoView({ block: 'nearest' }) : undefined}
            >
              {w}
            </span>{' '}
          </Fragment>
        ))}
      </p>

      <textarea
        className={p.error ? 'type-box error' : 'type-box'}
        value={input}
        onChange={(e) => onChange(e.target.value)}
        onPaste={block}
        onDrop={block}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        rows={3}
        placeholder="Digita qui le parole, gli spazi non contano…"
      />
      {p.error && <p className="error-text small">C'è un errore dopo «{words[p.words - 1] ?? 'inizio'}». Correggi per continuare.</p>}
    </div>
  );
}
