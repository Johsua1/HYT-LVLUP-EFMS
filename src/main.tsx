import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { AuthProvider } from '@/auth/AuthProvider';
import { installInspectGuard } from '@/lib/inspectGuard';
import AppRoutes from './App';
import './index.css';

/* Cosmetic "Inspect" deterrent — see src/lib/inspectGuard.ts. It is NOT the
   security boundary; Row Level Security and the Edge Function are. */
installInspectGuard();

/**
 * A hash router keeps the app deployable as a plain static bundle — opening
 * `dist/index.html` directly, or hosting it on any static server, works without
 * rewrite rules.
 *
 * `AuthProvider` owns the Supabase session; the authenticated data store is
 * mounted further down, inside `AppRoutes`, so it only runs once a user is
 * signed in.
 */
const container = document.getElementById('root');
if (!container) throw new Error('Root element #root was not found in index.html.');

createRoot(container).render(
  <StrictMode>
    <HashRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </HashRouter>
  </StrictMode>,
);
