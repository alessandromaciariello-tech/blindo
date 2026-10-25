import { useRef, useState } from 'react';
import { AppShell } from '../components/Layout';
import { Dots } from '../components/SequencePlayer';
import {
  discardSetup,
  exportBackup,
  finishSetup,
  importBackup,
  MAX_WORDS,
  setWordsRequired,
  useVault,
  wipe,
} from '../lib/vault';

const isStandalone = () =>
  matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true;

const SKIP_INSTALL = 'blindo:skip-install';

// On iOS a Home Screen web app has its own storage, separate from Safari: the code
// must be saved from inside the installed app or it won't be there later.
function InstallGate({ onSkip }: { onSkip: () => void }) {
  return (
    <AppShell>
      <p className="eyebrow">Prima di tutto</p>
      <h1 className="page-title">Installa Blindo sull'iPhone</h1>
      <p className="lead">
        Il codice viene salvato dentro l'app installata. Se lo configuri da Safari, l'icona sulla Home non lo vedrà.
      </p>
      <ol className="steps-list">
        <li>In Safari tocca <b>Condividi</b> <span className="share-icon" aria-hidden="true">⬆︎</span> nella barra in basso.</li>
        <li>Scorri e tocca <b>Aggiungi alla schermata Home</b>, poi <b>Aggiungi</b>.</li>
        <li>Chiudi Safari e apri Blindo dall'icona sulla Home.</li>
      </ol>
      <button
        className="link small"
        onClick={() => {
          try {
            sessionStorage.setItem(SKIP_INSTALL, '1');
          } catch {
            /* ignore */
          }
          onSkip();
        }}
      >
        Continua nel browser (sconsigliato)
      </button>
    </AppShell>
  );
}

function download(name: string, text: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function Dashboard() {
  const vault = useVault();
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');
  const [skipInstall, setSkipInstall] = useState(() => {
    try {
      return sessionStorage.getItem(SKIP_INSTALL) === '1';
    } catch {
      return false;
    }
  });

  if (!isStandalone() && !skipInstall && !vault.hasCode) return <InstallGate onSkip={() => setSkipInstall(true)} />;

  return (
    <AppShell>
      {vault.setupInProgress && (
        <div className="callout warn">
          <b>Configurazione in corso.</b>
          <div className="stack">
            <a className="btn small" href="#/setup">Riprendi</a>
            <button className="btn small ghost" onClick={finishSetup}>iOS ha già accettato il codice</button>
            <button
              className="btn small ghost"
              onClick={() => confirm('Annullare? Fallo solo se iOS non ha salvato il nuovo codice.') && discardSetup()}
            >
              Annulla configurazione
            </button>
          </div>
        </div>
      )}

      {!vault.hasCode ? (
        <section className="hero-card">
          <Dots filled={0} length={4} />
          <h1 className="page-title">Niente è ancora blindato</h1>
          <p className="lead">Ci vogliono circa cinque minuti e un iPhone con Tempo di utilizzo attivo.</p>
          <a className="btn wide" href="#/setup">Inizia la configurazione</a>
        </section>
      ) : (
        <section className="hero-card locked">
          <Dots filled={4} length={4} />
          <h1 className="page-title">Blindato</h1>
          <p className="lead">
            Dal {new Date(vault.codeSetAt!).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}.
            Per vedere il codice servono {vault.wordsRequired} parole.
          </p>
          <div className="stack">
            <a className="btn ghost wide" href="#/unlock">Recupera il codice</a>
            <a className="btn ghost wide" href="#/recovery">
              {vault.hasRecovery ? 'Account di recupero: configurato' : 'Configura account di recupero'}
            </a>
          </div>
        </section>
      )}

      {!isStandalone() && (
        <div className="callout">
          Stai usando Blindo nel browser. Safari può cancellare i dati dopo qualche giorno di inattività, e con loro il
          codice: esporta un backup qui sotto.
        </div>
      )}

      <section className="card">
        <h3>Parole richieste</h3>
        <p className="muted small">Puoi alzarle quando vuoi. Abbassarle è possibile solo dopo aver sbloccato il codice.</p>
        <div className="row">
          <span className="mono big-num">{vault.wordsRequired}</span>
          <button className="btn small ghost" disabled={vault.wordsRequired >= MAX_WORDS} onClick={() => setWordsRequired(vault.wordsRequired + 50)}>+50</button>
          <button className="btn small ghost" disabled={vault.wordsRequired >= MAX_WORDS} onClick={() => setWordsRequired(vault.wordsRequired + 200)}>+200</button>
        </div>
      </section>

      <section className="card">
        <h3>Backup</h3>
        <p className="muted small">
          Il file contiene il codice offuscato, non leggibile a occhio. Tienilo da qualche parte di scomodo: serve solo
          se cambi telefono o cancelli i dati del browser.
        </p>
        <div className="row">
          <button className="btn small ghost" disabled={!vault.hasCode} onClick={() => download('blindo-backup.json', exportBackup())}>Esporta</button>
          <button className="btn small ghost" onClick={() => fileRef.current?.click()}>Importa</button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            hidden
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                importBackup(await file.text());
                setMessage('Backup importato.');
              } catch (err) {
                setMessage((err as Error).message);
              }
              e.target.value = '';
            }}
          />
        </div>
        {message && <p className="small">{message}</p>}
      </section>

      <section className="card danger">
        <h3>Elimina tutto</h3>
        <p className="muted small">
          Cancella codice e credenziali da questo dispositivo. Se il codice è ancora attivo su iOS, non potrai più
          recuperarlo.
        </p>
        <button
          className="btn small danger"
          onClick={() => {
            if (prompt('Scrivi ELIMINA per confermare') === 'ELIMINA') wipe();
          }}
        >
          Elimina dati
        </button>
      </section>
    </AppShell>
  );
}
