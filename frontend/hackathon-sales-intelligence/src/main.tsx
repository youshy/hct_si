import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ToastProvider } from './components/Toast.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import { OfflineIndicator } from './components/OfflineIndicator.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <OfflineIndicator />
        <App />
      </ToastProvider>
    </ErrorBoundary>
  </StrictMode>,
)
