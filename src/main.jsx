// © 2026 Webcore Solutions · CoreFlow · Uso confidencial. Prohibida su copia o redistribución sin autorización escrita.
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { installRouter } from './lib/router'

installRouter()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
