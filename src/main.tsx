import { StrictMode, lazy, Suspense, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import ErrorBoundary from './ErrorBoundary';

const App = lazy(() => import('./App'));
const LandingPage = lazy(() => import('./LandingPage'));
const isPublicHome = window.location.pathname === '/' && !window.location.hash.startsWith('#/menu/');

function Root() {
  const [showApp, setShowApp] = useState(!isPublicHome);

  useEffect(() => {
    if (!isPublicHome) return;
    let cancelled = false;
    import('@supabase/supabase-js')
      .then(({ createClient }) => {
        const url = import.meta.env.VITE_SUPABASE_URL;
        const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
        if (!url || !key) return undefined;
        return createClient(url, key).auth.getSession();
      })
      .then((result) => {
        if (!cancelled && result?.data.session) {
          window.history.replaceState({ kinetiqrView: 'overview' }, '', '/overview');
          setShowApp(true);
        }
      })
      .catch(() => {
        // The public landing page remains usable if session lookup is unavailable.
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <Suspense fallback={<div className="kq-loading-screen" role="status" aria-live="polite">
    <div className="kq-loader-glow" aria-hidden="true"/>
    <div className="kq-loader-brand">
      <div className="kq-loader-mark"><span/><span/><span/><span/></div>
      <span>KinetiQR<span className="kq-loader-dot">.</span></span>
    </div>
    <div className="kq-loader-stage" aria-hidden="true">
      <div className="kq-loader-orbit kq-orbit-one"/><div className="kq-loader-orbit kq-orbit-two"/>
      <div className="kq-loader-center"><div className="kq-loader-qr"><i/><i/><i/><i/><b/><b/><b/></div></div>
      <span className="kq-loader-spark kq-spark-one"/><span className="kq-loader-spark kq-spark-two"/><span className="kq-loader-spark kq-spark-three"/>
    </div>
    <div className="kq-loader-copy"><strong>Making every scan count</strong><span>Preparing your KinetiQR workspace</span></div>
    <div className="kq-loader-progress"><span/></div>
    <span className="kq-loader-foot">SMARTER QR EXPERIENCES</span>
  </div>}>
      <ErrorBoundary>
        {showApp ? <App /> : <LandingPage />}
      </ErrorBoundary>
    </Suspense>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
