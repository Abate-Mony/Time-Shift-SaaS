import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ThemeProvider } from './providers/ThemeProvider'
import { registerSW } from 'virtual:pwa-register'
import { clearStaleChunkReloadGuard } from './utils/staleChunkGuard'

// Drives the service worker's autoUpdate lifecycle: checks for a new
// worker, tells a waiting one to activate, and reloads once it takes
// over — without this, a browser's SW can keep serving a precached
// index.html from an old deploy, which 404s on that deploy's asset hashes.
registerSW({ immediate: true })

// This boot succeeded, so any earlier stale-chunk auto-reload (see
// ErrorElement.tsx) already did its job — clear its one-shot guard so a
// *later* deploy, hours into this same long-lived tab, still gets its own
// automatic reload instead of being silently suppressed by that old guard.
clearStaleChunkReloadGuard()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <App />
      </GoogleOAuthProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
