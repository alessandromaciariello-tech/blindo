import { useState } from 'react';
import { AppShell } from '../components/Layout';
import { SequencePlayer } from '../components/SequencePlayer';
import { buildSteps, generateCode } from '../lib/sequence';
import { lock, useUnlockedUntil } from '../lib/session';
import { finishSetup, getCode, loadSetup, requestPersistence, saveSetup, useVault, type SetupProgress } from '../lib/vault';

export function Setup() {
  const vault = useVault();
  const unlocked = useUnlockedUntil() > 0;
  // Every move is saved: if iOS kills the app while you're in Settings, it reopens on the same step.
  const [progress, setProgress] = useState<SetupProgress | undefined>(loadSetup);
  const [resumed] = useState(() => !!progress);
  const [done, setDone] = useState(false);
  // Fixed at mount: finishing the flow sets a code, which must not flip the mode.
  const [changing] = useState(vault.hasCode);

  const update = (p: SetupProgress) => {
    saveSetup(p);
    setProgress(p);
  };

  const start = () => {
    requestPersistence();
    const code = generateCode();
    const oldCode = changing ? getCode() : undefined;
    update({ code, oldCode, phase: oldCode ? 'old' : 'enter', index: 0, enter: buildSteps(code), confirm: buildSteps(code) });
  };

  if (done) {
    return (
      <AppShell>
        <p className="eyebrow">Fatto</p>
        <h1 className="page-title">Codice blindato.</h1>
        <p className="lead">
          Ora iOS potrebbe chiederti un Apple ID per recuperare il codice. Se usi il tuo, potrai reimpostarlo in un
          attimo e il blocco non serve a niente.
        </p>
        <div className="stack">
          {!vault.hasRecovery && <a className="btn wide" href="#/recovery">Configura un account di recupero</a>}
          <a className="btn ghost wide" href="#/">Vai alla home</a>
        </div>
      </AppShell>
    );
  }

  if (!progress) {
    if (changing && !unlocked) {
      return (
        <AppShell back="#/">
          <h1 className="page-title">Prima sblocca il codice</h1>
          <p className="lead">Per cambiare il codice di Tempo di utilizzo devi conoscere quello attuale.</p>
          <a className="btn wide" href="#/unlock">Sblocca con le parole</a>
        </AppShell>
      );
    }
    return (
      <AppShell back="#/">
        <p className="eyebrow">{changing ? 'Cambia codice' : 'Configurazione'}</p>
        <h1 className="page-title">Blinda il Tempo di utilizzo</h1>
        <p className="lead">
          Blindo sceglie un codice a caso e te lo detta un tasto alla volta, con calcoli e cancellazioni nel mezzo. Alla
          fine sarà nelle Impostazioni, ma non nella tua testa.
        </p>
        <ol className="steps-list">
          {changing ? (
            <li>Apri <b>Impostazioni → Tempo di utilizzo → Cambia codice</b>.</li>
          ) : (
            <li>
              Apri <b>Impostazioni → Tempo di utilizzo</b> e tocca <b>Blocca impostazioni</b> (o <b>Usa codice</b>, a
              seconda della versione di iOS).
            </li>
          )}
          <li>Quando vedi il tastierino, torna qui scorrendo la barra in basso verso destra.</li>
          <li>Per ogni passo: torna in Impostazioni, premi un tasto, torna qui e tocca <b>Avanti</b>.</li>
        </ol>
        <button className="btn wide" onClick={start}>Vedo il tastierino, iniziamo</button>
      </AppShell>
    );
  }

  const { code, phase } = progress;

  return (
    <AppShell back="#/">
      {resumed && progress.index > 0 && <p className="callout">Ripreso da dove eri rimasto.</p>}

      {phase === 'old' && (
        <>
          <p className="eyebrow">Codice attuale</p>
          <h1 className="page-title">Inserisci il codice attuale</h1>
          <p className="code-reveal mono">{progress.oldCode}</p>
          <p className="lead">iOS ti chiede prima il codice vecchio. Inseriscilo, poi continua.</p>
          <button className="btn wide" onClick={() => update({ ...progress, phase: 'enter', index: 0 })}>
            Fatto, ora chiede quello nuovo
          </button>
        </>
      )}

      {phase === 'enter' && (
        <>
          <h1 className="page-title">Nuovo codice</h1>
          <SequencePlayer
            steps={progress.enter}
            length={code.length}
            index={progress.index}
            onIndex={(index) => update({ ...progress, index })}
            onDone={() => update({ ...progress, phase: 'confirm', index: 0 })}
            doneLabel="iOS chiede di confermare"
          />
        </>
      )}

      {phase === 'confirm' && (
        <>
          <h1 className="page-title">Conferma</h1>
          <p className="lead">iOS vuole il codice una seconda volta. La sequenza è diversa, il risultato è lo stesso.</p>
          <SequencePlayer
            steps={progress.confirm}
            length={code.length}
            index={progress.index}
            onIndex={(index) => update({ ...progress, index })}
            onMismatch={() => update({ ...progress, phase: 'enter', index: 0 })}
            doneLabel="iOS ha accettato il codice"
            onDone={() => {
              finishSetup();
              lock();
              setDone(true);
            }}
          />
        </>
      )}
    </AppShell>
  );
}
