import { Link, NavLink, Outlet } from 'react-router-dom';
import { steps } from '../steps';
import { useImplementationDetails } from '../context/ImplementationDetailsContext';

// Shared site layout: top navigation across Step 0–7 and the single master
// "Show implementation details" control that governs every step page.
export default function Layout() {
  const { showDetails, toggleDetails } = useImplementationDetails();

  return (
    <div className="layout">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <header className="site-header">
        <div className="site-header__bar">
          <Link to="/step-0" className="site-header__brand">
            PocketGaze
          </Link>
          <label className="details-toggle">
            <input
              type="checkbox"
              checked={showDetails}
              onChange={toggleDetails}
            />
            <span>Show implementation details</span>
          </label>
        </div>
        <nav className="site-nav" aria-label="Pipeline steps">
          {steps.map((step) => (
            <NavLink
              key={step.slug}
              to={`/${step.slug}`}
              className={({ isActive }) =>
                isActive ? 'site-nav__link site-nav__link--active' : 'site-nav__link'
              }
            >
              {step.navLabel}
            </NavLink>
          ))}
        </nav>
      </header>

      <main id="main-content" className="site-main">
        <Outlet />
      </main>

      <footer className="site-footer">
        <p>
          PocketGaze — a portfolio explainer of smartphone-camera eye tracking.
          All processing runs locally in your browser.
        </p>
        <p>
          <Link to="/about" className="site-footer__link">About &amp; Privacy</Link>
        </p>
      </footer>
    </div>
  );
}
