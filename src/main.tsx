import React from 'react';
import ReactDOM from 'react-dom/client';
import '@/core/config/env'; // Validate ENV variables early
import { App } from '@/app/App';
import '@/styles/global.css';

import { ErrorBoundary } from '@/core/components/ErrorBoundary';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    </React.StrictMode>
);
