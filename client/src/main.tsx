import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import { App } from './app/App';
import { LanguagePrompt } from './i18n/LanguagePrompt';
import { LanguageProvider } from './i18n/LanguageProvider';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LanguageProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
      <LanguagePrompt />
    </LanguageProvider>
  </React.StrictMode>,
);
