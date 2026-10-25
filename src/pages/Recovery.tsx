import { useState } from 'react';
import { AppShell, CopyField } from '../components/Layout';
import { generatePassword } from '../lib/password';
import { setRecovery, useVault } from '../lib/vault';

export function Recovery() {
  const vault = useVault();
  const [emailPassword] = useState(() => generatePassword());
  const [applePassword] = useState(() => generatePassword());
  const [appleId, setAppleId] = useState('');
  const [saved, setSaved] = useState(false);
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(appleId);

  if (vault.hasRecovery && !saved) {
    return (
      <AppShell back="#/">
        <p className="eyebrow">Account di recupero</p>
        <h1 className="page-title">Già configurato</h1>
        <p className="lead">Le credenziali sono nascoste insieme al codice. Le vedi solo dopo la sfida delle parole.</p>
        <a className="btn" href="#/unlock">Sblocca</a>
      </AppShell>
    );
  }

  if (saved) {
    return (
      <AppShell back="#/">
        <p className="eyebrow">Fatto</p>
        <h1 className="page-title">Credenziali nascoste.</h1>
        <p className="lead">
          Esci dalla nuova email e dal nuovo Apple ID su tutti i dispositivi. Da adesso l'unico modo per recuperare il
          codice passa da Blindo.
        </p>
        <a className="btn wide" href="#/">Vai alla dashboard</a>
      </AppShell>
    );
  }

  return (
    <AppShell back="#/">
      <p className="eyebrow">Account di recupero</p>
      <h1 className="page-title">Chiudi la porta sul retro</h1>
      <p className="lead">
        Se il recupero del codice è legato al tuo Apple ID, puoi reimpostarlo quando vuoi. Usa invece un Apple ID
        nuovo, di cui solo Blindo conosce le credenziali.
      </p>

      <ol className="steps-list">
        <li>
          Crea un nuovo indirizzo email che non usi per altro (Gmail, Outlook, ecc.) con questa password:
          <CopyField label="Password email" value={emailPassword} />
          <label className="field">
            <span className="muted small">Indirizzo email creato</span>
            <input type="email" inputMode="email" autoComplete="off" value={appleId} onChange={(e) => setAppleId(e.target.value.trim())} placeholder="nome.casuale@esempio.com" />
          </label>
        </li>
        <li>
          Crea un Apple ID con quell'indirizzo su <a href="https://account.apple.com" target="_blank" rel="noreferrer">account.apple.com</a>{' '}
          usando questa password:
          <CopyField label="Password Apple ID" value={applePassword} />
        </li>
        <li>
          Sull'iPhone, quando Tempo di utilizzo chiede l'Apple ID per il <b>recupero del codice</b>, inserisci il nuovo
          Apple ID.
        </li>
      </ol>

      <div className="callout">Dopo aver salvato, queste credenziali non verranno più mostrate senza la sfida delle parole.</div>
      <button
        className="btn wide"
        disabled={!validEmail}
        onClick={() => {
          setRecovery({ appleId, applePassword, emailPassword });
          setSaved(true);
        }}
      >
        Ho finito, nascondi le credenziali
      </button>
    </AppShell>
  );
}
