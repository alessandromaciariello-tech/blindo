import type { ReactNode } from 'react';

export function Logo() {
  return (
    <a href="#/" className="logo">
      <img src="./icon.svg" alt="" width={28} height={28} />
      <span>Blindo</span>
    </a>
  );
}

export function AppShell({ children, back }: { children: ReactNode; back?: string }) {
  return (
    <div className="app-shell">
      <header className="app-bar">
        {back ? <a className="link" href={back}>← Indietro</a> : <Logo />}
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}

export function CopyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="copy-field">
      <span className="muted small">{label}</span>
      <div className="copy-row">
        <code className="mono">{value}</code>
        <button className="btn small ghost" onClick={() => navigator.clipboard?.writeText(value)}>Copia</button>
      </div>
    </div>
  );
}
