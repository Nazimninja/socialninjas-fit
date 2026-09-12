import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import AppLayout from './pages/AppLayout';
import './v2.css';

const rootEl = document.getElementById('root');
if (rootEl) {
  const isHtml = window.location.pathname.startsWith('/v2.html');
  const basename = isHtml ? '/v2.html' : '/v2';

  createRoot(rootEl).render(
    <React.StrictMode>
      <BrowserRouter basename={basename}>
        <AppLayout />
      </BrowserRouter>
    </React.StrictMode>
  );
}
