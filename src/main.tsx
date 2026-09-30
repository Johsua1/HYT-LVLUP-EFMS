import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { AppStoreProvider } from '@/store/AppStore';
import AppRoutes from './App';
import './index.css';

/**
 * A hash router keeps the prototype deployable as a plain static bundle —
 * opening `dist/index.html` directly, or hosting it on any static server,
 * works without rewrite rules.
 */
const container = document.getElementById('root');
if (!container) throw new Error('Root element #root was not found in index.html.');

createRoot(container).render(
  <StrictMode>
    <AppStoreProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AppStoreProvider>
  </StrictMode>,
);
