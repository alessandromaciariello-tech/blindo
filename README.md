# Blindo

Web app mobile-first ispirata al concetto di Shutout: imposta un codice di Tempo di utilizzo che non ricordi,
lo custodisce offuscato nel browser e lo rivela solo dopo aver digitato N parole casuali.

```bash
npm install
npm run dev     # http://localhost:5173
npm test        # vitest
npm run build   # output in dist/
```

- `src/lib/sequence.ts` — genera il codice e la sequenza di calcoli/cancellazioni
- `src/lib/challenge.ts` — sfida delle parole
- `src/lib/vault.ts` — salvataggio offuscato in localStorage, backup
- `src/pages/` — landing, dashboard, configurazione, sblocco, account di recupero

Tutto resta sul dispositivo: nessun server, nessun account.
