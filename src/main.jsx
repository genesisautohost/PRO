import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import './styles/global.css'

/**
 * On-screen error reporter — surfaces any uncaught error (incl. failed chunk
 * loads / WebGL) directly on the page, so a blank screen becomes a readable
 * message even on mobile where the console is hard to reach.
 */
function showError(msg) {
  let bar = document.getElementById('err-overlay')
  if (!bar) {
    bar = document.createElement('div')
    bar.id = 'err-overlay'
    bar.style.cssText =
      'position:fixed;left:0;right:0;bottom:0;z-index:99999;max-height:45vh;overflow:auto;' +
      'background:rgba(20,0,0,.92);color:#ff8a8a;font:12px/1.5 monospace;padding:12px 14px;' +
      'white-space:pre-wrap;border-top:2px solid #ff5d5d'
    document.body.appendChild(bar)
  }
  bar.textContent += msg + '\n'
}

window.addEventListener('error', (e) => {
  showError('⚠ ' + (e.message || 'error') + (e.filename ? '\n  ' + e.filename + ':' + e.lineno : ''))
})
window.addEventListener('unhandledrejection', (e) => {
  const r = e.reason
  showError('⚠ promise: ' + (r && r.message ? r.message : String(r)))
})

console.log('%c0xshikhar build v10', 'color:#ffb454;font:600 14px monospace')

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary
      label="root"
      fallback={
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            textAlign: 'center',
            color: '#d7dce3',
            fontFamily: 'monospace',
          }}
        >
          Something failed to load — check the error at the bottom of the screen.
        </div>
      }
    >
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)
