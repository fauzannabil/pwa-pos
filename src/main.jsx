import { registerSW } from 'virtual:pwa-register';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { startAutoSync } from './services/syncService';

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    window.__pwaUpdateSW = updateSW;
    window.dispatchEvent(
      new CustomEvent(
        'pwa:update-available'
      )
    );
  },
  onOfflineReady() {
    window.dispatchEvent(
      new CustomEvent(
        'pwa:offline-ready'
      )
    );
  },
});

startAutoSync();
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
