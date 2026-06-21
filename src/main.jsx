import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { UIProvider } from './ui-context.jsx';

import 'leaflet/dist/leaflet.css';
import './styles/base.css';
import './styles/shell.css';
import './styles/lenses.css';
import './styles/rtl.css';

class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error('[Atlas] render error', error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '3rem', maxWidth: 640, margin: '0 auto', fontFamily: 'Spectral, serif' }}>
          <h1 style={{ fontFamily: 'Amiri, serif' }}>Bir hata oluştu</h1>
          <p style={{ color: '#6d6452' }}>
            Atlası yeniden yüklemeyi deneyin. · Try reloading the atlas.
          </p>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#6e2f3f', fontSize: '0.8rem' }}>
            {String(this.state.error?.message || this.state.error)}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}
          >
            Yenile / Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

window.addEventListener('unhandledrejection', (e) => {
  console.error('[Atlas] unhandled rejection', e.reason);
});

// register service worker (PWA) in production builds
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    const base = import.meta.env.BASE_URL || '/';
    navigator.serviceWorker.register(`${base}sw.js`).catch(() => {});
  });
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GlobalErrorBoundary>
      <UIProvider>
        <App />
      </UIProvider>
    </GlobalErrorBoundary>
  </React.StrictMode>
);
