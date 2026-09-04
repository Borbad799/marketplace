import { Component, StrictMode, useEffect, type ErrorInfo, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { useAuth } from './store/auth'

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info)
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ fontFamily: 'sans-serif', padding: 32, maxWidth: 480, margin: '40px auto' }}>
          <h1 style={{ fontSize: 22 }}>Саҳифа кушода нашуд</h1>
          <p style={{ color: '#777' }}>{this.state.error.message}</p>
          <button
            type="button"
            onClick={() => location.reload()}
            style={{ marginTop: 16, background: '#FF4D30', color: '#fff', border: 0, borderRadius: 999, padding: '10px 18px', fontWeight: 700 }}
          >
            Аз нав кӯшиш
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

function Root() {
  const hydrate = useAuth((s) => s.hydrate)
  useEffect(() => {
    hydrate()
  }, [hydrate])
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <Root />
    </ErrorBoundary>
  </StrictMode>,
)
