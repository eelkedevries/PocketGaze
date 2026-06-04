import type { ComponentType, ReactNode } from 'react';
import { step1Demo } from './step1';
import { step2Demo } from './step2';
import { step3Demo } from './step3';
import { step4Demo } from './step4';
import { step5Demo } from './step5';

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

/** Demos keyed by step slug. Steps without an entry render the standard shell. */
export const stepDemos: Record<string, StepDemo> = {
  'step-1': step1Demo,
  'step-2': step2Demo,
  'step-3': step3Demo,
  'step-4': step4Demo,
  'step-5': step5Demo,
};
