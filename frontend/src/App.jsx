import { useState } from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useAuth } from './AuthContext'
import LoginModal from './LoginModal'
import Home from './pages/Home'
import About from './pages/About'
import HowItWorks from './pages/HowItWorks'
import FAQ from './pages/FAQ'
import './App.css'

function App() {
  const { user, usage, logout } = useAuth()
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="app-container max-w-7xl mx-auto">
      <header className="app-header">
        <ToastContainer position="top-right" autoClose={3000} />
        <div className="auth-bar">
          <div className="usage-stats">
            <span className={`usage-pill ${usage.emailCount >= usage.emailLimit ? 'usage-limit' : ''}`}>
              ✉️ Emails: <strong>{usage.emailCount}/{usage.emailLimit}</strong>
            </span>
            <span className={`usage-pill ${usage.messageCount >= usage.messageLimit ? 'usage-limit' : ''}`}>
              💬 Messages: <strong>{usage.messageCount}/{usage.messageLimit}</strong>
            </span>
            {!user && (usage.emailCount >= usage.emailLimit || usage.messageCount >= usage.messageLimit) && (
              <span className="sign-up-prompt">Sign up for more free!</span>
            )}
          </div>
          
          <nav className="nav-links">
            <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Generator</Link>
            <Link to="/how-it-works" className={location.pathname === '/how-it-works' ? 'active' : ''}>How It Works</Link>
            <Link to="/faq" className={location.pathname === '/faq' ? 'active' : ''}>FAQ</Link>
            <Link to="/about" className={location.pathname === '/about' ? 'active' : ''}>About</Link>
          </nav>

          <div className="user-actions">
            {user ? (
              <>
                <span className="user-email">{user.email}</span>
                <button onClick={logout} className="btn-link">Logout</button>
              </>
            ) : (
              <button onClick={() => setIsLoginModalOpen(true)} className="btn btn-primary btn-sm">
                Login / Signup
              </button>
            )}
          </div>
        </div>
        
        <div className="header-titles">
          <h1>AI Cold Mail & Message Generator</h1>
          <p>Generate personalized cold emails and messages for your potential clients</p>
        </div>
      </header>

      <main className="content-area">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/faq" element={<FAQ />} />
        </Routes>
      </main>

      <footer className="app-footer">
        <p>© {new Date().getFullYear()} AI Cold Outreach Tool. Built with ❤️ for professionals.</p>
      </footer>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </div>
  )
}

export default App
