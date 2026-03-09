import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { AuthProvider } from './AuthContext'
import './index.css'
import App from './App.jsx'

// Replace with your actual Google Client ID from Google Cloud Console
const GOOGLE_CLIENT_ID = "703335616589-p16fkbldg9jpq04gs71cq2iqfh2la16b.apps.googleusercontent.com"

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
)
