/**
 * ============================================================================
 * Application Entry Point (main.tsx)
 * ============================================================================
 * 
 * Feature Description:
 * The primary client-side bootstrap file. Mounts the React component hierarchy
 * into the DOM within a React.StrictMode and a top-level ErrorBoundary to guarantee
 * zero white-screen crashes across all user actions.
 * ============================================================================
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root DOM element #root not found in document.');
}

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary fallbackTitle="QuantLib Migration Studio Application">
      <App />
    </ErrorBoundary>
  </StrictMode>
);
