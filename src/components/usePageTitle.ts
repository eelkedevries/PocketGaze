import { useEffect } from 'react';

const SITE_NAME = 'PocketGaze';

/**
 * Set the document title for the current page, restoring the bare site name on
 * unmount. With a hash router every step is one document, so without this the
 * browser history and tab title would read "PocketGaze" for every page.
 */
export function usePageTitle(title: string | null): void {
  useEffect(() => {
    document.title = title ? `${title} — ${SITE_NAME}` : SITE_NAME;
    return () => {
      document.title = SITE_NAME;
    };
  }, [title]);
}
