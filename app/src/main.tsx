import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('Main.tsx starting - Build: ' + new Date().toISOString());
ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)

// Register Service Worker for PWA / Notifications
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
            console.log('SW registered: ', registration);

            // Handle updates
            registration.onupdatefound = () => {
                const installingWorker = registration.installing;
                if (installingWorker) {
                    installingWorker.onstatechange = () => {
                        if (installingWorker.state === 'installed') {
                            if (navigator.serviceWorker.controller) {
                                console.log('New content is available; please refresh.');
                                // Optionally force reload or show a toast
                                if (window.confirm('A new version of TwoDo is available. Update now?')) {
                                    window.location.reload();
                                }
                            } else {
                                console.log('Content is cached for offline use.');
                            }
                        }
                    };
                }
            };
        }).catch(err => {
            console.log('SW registration failed: ', err);
        });
    });
}
