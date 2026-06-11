import { lazy, type ComponentType, type ReactNode } from 'react';

// Per-step live demos (specification §2.3, §2.6). A step that provides a demo
// supplies three pieces sharing state via a provider that StepPage mounts around
// the page:
//   - Provider: owns the demo's state (camera, timing, ...).
//   - LiveDemo: the main demo area (page section 4).
//   - DetailsPanels: the implementation/subprocess panels, rendered in the
//     master-controlled "Implementation details" section (page section 5).
export interface StepDemo {
  Provider: ComponentType<{ children: ReactNode }>;
  LiveDemo: ComponentType;
  DetailsPanels: ComponentType;
}

// Each step demo (and everything only it imports — the MediaPipe runtime, the
// per-step pipeline modules) is code-split into its own lazy chunk, so the
// initial bundle stays small on the mid-range phones the site targets (§2.8).
// The three lazy pieces share one dynamic import, so a step loads as one chunk;
// StepPage wraps demo pages in <Suspense> to show a loading state meanwhile.
type DemoModule<K extends string> = Record<K, StepDemo>;

function lazyDemo<K extends string>(load: () => Promise<DemoModule<K>>, exportName: K): StepDemo {
  return {
    Provider: lazy(async () => ({ default: (await load())[exportName].Provider })),
    LiveDemo: lazy(async () => ({ default: (await load())[exportName].LiveDemo })),
    DetailsPanels: lazy(async () => ({ default: (await load())[exportName].DetailsPanels })),
  };
}

/** Demos keyed by step slug. Steps without an entry render the standard shell. */
export const stepDemos: Record<string, StepDemo> = {
  'step-1': lazyDemo(() => import('./step1'), 'step1Demo'),
  'step-2': lazyDemo(() => import('./step2'), 'step2Demo'),
  'step-3': lazyDemo(() => import('./step3'), 'step3Demo'),
  'step-4': lazyDemo(() => import('./step4'), 'step4Demo'),
  'step-5': lazyDemo(() => import('./step5'), 'step5Demo'),
  'step-6': lazyDemo(() => import('./step6'), 'step6Demo'),
  'step-7': lazyDemo(() => import('./step7'), 'step7Demo'),
};
