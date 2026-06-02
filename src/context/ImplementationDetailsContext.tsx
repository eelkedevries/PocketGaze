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

interface ImplementationDetailsContextValue {
  showDetails: boolean;
  toggleDetails: () => void;
  setShowDetails: (value: boolean) => void;
}

const ImplementationDetailsContext = createContext<
  ImplementationDetailsContextValue | undefined
>(undefined);

export function ImplementationDetailsProvider({ children }: { children: ReactNode }) {
  const [showDetails, setShowDetails] = useState(false);
  const toggleDetails = useCallback(() => setShowDetails((value) => !value), []);

  const value = useMemo(
    () => ({ showDetails, toggleDetails, setShowDetails }),
    [showDetails, toggleDetails],
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
