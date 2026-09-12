import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import AppLayout from './pages/AppLayout';
import './v2.css';

const rootEl = document.getElementById('root');
if (rootEl) {
  const pathname = window.location.pathname;
  const basename = pathname.startsWith('/app.html') ? '/app.html'
    : pathname.startsWith('/app') ? '/app'
    : pathname.startsWith('/v2.html') ? '/v2.html'
    : pathname.startsWith('/v2') ? '/v2'
    : '';

  createRoot(rootEl).render(
    <React.StrictMode>
      <BrowserRouter basename={basename}>
        <AppLayout />
      </BrowserRouter>
    </React.StrictMode>
  );
}
