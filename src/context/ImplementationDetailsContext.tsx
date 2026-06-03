import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

// Master "Show implementation details" control.
//
// This single, site-wide switch decides whether each step page reveals its
// optional implementation/subprocess panels. When it is off, pages show only
// the main live-demo area and the core explanatory content. When on, the
// additional placeholder panels become visible.
//
// In this scaffold the toggle only shows or hides placeholder panels; the real
// subprocess visualisations are added by later prompts.

const STORAGE_KEY = 'pocketgaze-show-details';

function readStoredValue(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function writeStoredValue(value: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(value));
  } catch {
    // storage unavailable, silently ignore
  }
}

interface ImplementationDetailsContextValue {
  showDetails: boolean;
  toggleDetails: () => void;
  setShowDetails: (value: boolean) => void;
}

const ImplementationDetailsContext = createContext<
  ImplementationDetailsContextValue | undefined
>(undefined);

export function ImplementationDetailsProvider({ children }: { children: ReactNode }) {
  const [showDetails, _setShowDetails] = useState(readStoredValue);

  const setShowDetails = useCallback((value: boolean) => {
    _setShowDetails(value);
    writeStoredValue(value);
  }, []);

  const toggleDetails = useCallback(() => {
    _setShowDetails((prev) => {
      const next = !prev;
      writeStoredValue(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ showDetails, toggleDetails, setShowDetails }),
    [showDetails, toggleDetails, setShowDetails],
  );

  return (
    <ImplementationDetailsContext.Provider value={value}>
      {children}
    </ImplementationDetailsContext.Provider>
  );
}

export function useImplementationDetails(): ImplementationDetailsContextValue {
  const context = useContext(ImplementationDetailsContext);
  if (context === undefined) {
    throw new Error(
      'useImplementationDetails must be used within an ImplementationDetailsProvider',
    );
  }
  return context;
}
