import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

import { AuthProvider } from './context/AuthContext'
import { WardProvider } from './context/WardContext'
import { AlertProvider } from './context/AlertContext'
import { RealtimeProvider } from './context/RealtimeContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <WardProvider>
        <AlertProvider>
          <RealtimeProvider>
            <App />
          </RealtimeProvider>
        </AlertProvider>
      </WardProvider>
    </AuthProvider>
  </React.StrictMode>,
)
