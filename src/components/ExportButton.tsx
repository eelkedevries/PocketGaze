import { useCallback, useState } from 'react';
import { downloadSessionCsv } from '../lib/exportCsv';
import type { SessionStore } from '../lib/sessionStore';

interface ExportButtonProps {
  store: SessionStore;
}

/**
 * A user-triggered download button that serialises the session store to the
 * locked combined CSV (§4.1) and initiates a local browser download. No data
 * leaves the device (§2.7).
 */
export default function ExportButton({ store }: ExportButtonProps) {
  const [exported, setExported] = useState(false);

  const handleClick = useCallback(() => {
    downloadSessionCsv(store);
    setExported(true);
    setTimeout(() => setExported(false), 2000);
  }, [store]);

  const rowCount = store.count();

  if (rowCount === 0) {
    return (
      <p className="panel__note">
        No session rows to export yet — start the demo first.
      </p>
    );
  }

  return (
    <div className="export-button-wrap">
      <button className="export-button" onClick={handleClick} type="button">
        {exported ? 'Downloaded ✓' : `Export CSV (${rowCount} rows)`}
      </button>
      <p className="panel__note">
        Downloads a single combined CSV with all §4 row types. Non-applicable fields are
        blank. Raw and filtered signals are in separate columns. No raw video or frames are
        exported (§2.7).
      </p>
    </div>
  );
}
