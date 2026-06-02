import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import StepPage from './components/StepPage';
import { ImplementationDetailsProvider } from './context/ImplementationDetailsContext';
import { steps } from './steps';

// HashRouter keeps deep links working on GitHub Pages without server-side
// rewrites, which suits a static project Pages site.
export default function App() {
  return (
    <ImplementationDetailsProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Navigate to="/step-0" replace />} />
            {steps.map((step) => (
              <Route
                key={step.slug}
                path={step.slug}
                element={<StepPage step={step} />}
              />
            ))}
            <Route path="*" element={<Navigate to="/step-0" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </ImplementationDetailsProvider>
  );
}
