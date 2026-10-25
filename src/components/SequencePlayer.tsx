import { useState } from 'react';
import type { Step } from '../lib/sequence';

interface Props {
  steps: Step[];
  length: number;
  index: number;
  onIndex: (i: number) => void;
  onDone: () => void;
  doneLabel?: string;
  /** Shown on the restart screen during confirmation, when iOS rejected the code. */
  onMismatch?: () => void;
}

export function Dots({ filled, length }: { filled: number; length: number }) {
  return (
    <div className="dots" aria-label={`${filled} cifre su ${length} inserite`}>
      {Array.from({ length }, (_, i) => (
        <span key={i} className={i < filled ? 'dot on' : 'dot'} />
      ))}
    </div>
  );
}

export function SequencePlayer({ steps, length, index: i, onIndex, onDone, doneLabel = 'Fatto', onMismatch }: Props) {
  const [restarting, setRestarting] = useState(false);
  const step = steps[i];
  const last = i === steps.length - 1;
  const before = i === 0 ? 0 : steps[i - 1].filled;

  if (restarting) {
    return (
      <div className="player">
        <p className="eyebrow">Ricomincia</p>
        <p className="lead">Sull'iPhone premi <b>Cancella</b> finché il campo del codice non è vuoto, poi riparti da capo.</p>
        <Dots filled={0} length={length} />
        <div className="stack">
          <button className="btn wide" onClick={() => (onIndex(0), setRestarting(false))}>Il campo è vuoto, riparti</button>
          {onMismatch && (
            <button className="btn ghost wide" onClick={() => (setRestarting(false), onMismatch())}>
              iOS dice che i codici non corrispondono
            </button>
          )}
          <button className="btn ghost wide" onClick={() => setRestarting(false)}>Annulla</button>
        </div>
      </div>
    );
  }

  return (
    <div className="player">
      <div className="player-head">
        <span className="eyebrow">Passo {i + 1} di {steps.length}</span>
        <button className="link" onClick={() => setRestarting(true)}>Ho sbagliato</button>
      </div>
      <div className="progress"><span style={{ width: `${((i + 1) / steps.length) * 100}%` }} /></div>

      <div className="player-card" key={i}>
        {step.kind === 'digit' ? (
          <>
            <p className="player-instr">Digita il risultato di</p>
            <p className="player-big mono">{step.prompt}</p>
          </>
        ) : (
          <>
            <p className="player-instr">Premi</p>
            <p className="player-big">⌫ Cancella</p>
          </>
        )}
      </div>

      <div className="player-dots" title="Cifre nel campo prima e dopo questo passo">
        <Dots filled={before} length={length} />
        <span className="arrow">→</span>
        <Dots filled={step.filled} length={length} />
      </div>

      <div className="player-nav">
        <button className="btn ghost" disabled={i === 0} onClick={() => onIndex(i - 1)}>Indietro</button>
        <button className="btn" onClick={() => (last ? onDone() : onIndex(i + 1))}>{last ? doneLabel : 'Avanti'}</button>
      </div>
    </div>
  );
}
