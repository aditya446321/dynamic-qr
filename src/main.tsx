import { StrictMode, lazy, Suspense, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

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
    <Suspense fallback={<div className="loading-screen">Loading KinetiQR…</div>}>
      {showApp ? <App /> : <LandingPage />}
    </Suspense>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
