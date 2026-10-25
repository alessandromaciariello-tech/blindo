import { useEffect, useState } from 'react';
import { AppShell, CopyField } from '../components/Layout';
import { WordChallenge } from '../components/WordChallenge';
import { go } from '../lib/router';
import { lock, unlock, useUnlockedUntil } from '../lib/session';
import { getCode, getRecovery, MIN_WORDS, setWordsRequired, useVault } from '../lib/vault';

function Countdown({ until }: { until: number }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const s = Math.max(0, Math.ceil((until - now) / 1000));
  return <span className="mono">{Math.floor(s / 60)}:{String(s % 60).padStart(2, '0')}</span>;
}

function Revealed({ until }: { until: number }) {
  const vault = useVault();
  const code = getCode();
  const recovery = getRecovery();
  const [words, setWords] = useState(vault.wordsRequired);

  return (
    <>
      <p className="eyebrow">Sbloccato · si richiude tra <Countdown until={until} /></p>
      <h1 className="page-title">Il tuo codice</h1>
      <p className="code-reveal mono">{code}</p>

      {recovery && (
        <div className="card">
          <h3>Account di recupero</h3>
          <CopyField label="Apple ID" value={recovery.appleId} />
          <CopyField label="Password Apple ID" value={recovery.applePassword} />
          <CopyField label="Password email" value={recovery.emailPassword} />
        </div>
      )}

      <div className="card">
        <h3>Parole richieste</h3>
        <p className="muted small">Puoi abbassare il numero solo adesso, mentre il codice è sbloccato.</p>
        <div className="range-row">
          <input type="range" min={MIN_WORDS} max={500} step={10} value={words} onChange={(e) => setWords(+e.target.value)} />
          <span className="mono">{words}</span>
        </div>
        <button className="btn small" disabled={words === vault.wordsRequired} onClick={() => setWordsRequired(words)}>Salva</button>
      </div>

      <div className="stack">
        <a className="btn wide" href="#/setup">Cambia codice (consigliato)</a>
        <button className="btn ghost wide" onClick={() => (lock(), go('/'))}>Nascondi di nuovo</button>
      </div>
    </>
  );
}

export function Unlock() {
  const vault = useVault();
  const until = useUnlockedUntil();

  if (!vault.hasCode) {
    return (
      <AppShell back="#/">
        <h1 className="page-title">Nessun codice salvato</h1>
        <a className="btn" href="#/setup">Configura Blindo</a>
      </AppShell>
    );
  }

  return (
    <AppShell back="#/">
      {until ? (
        <Revealed until={until} />
      ) : (
        <>
          <p className="eyebrow">Recupero</p>
          <h1 className="page-title">Ne hai davvero bisogno?</h1>
          <p className="lead">
            Digita le {vault.wordsRequired} parole qui sotto per vedere il codice. Niente copia e incolla. Se chiudi la
            pagina, si ricomincia con parole nuove.
          </p>
          <WordChallenge count={vault.wordsRequired} onDone={unlock} />
        </>
      )}
    </AppShell>
  );
}
