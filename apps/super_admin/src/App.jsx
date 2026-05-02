// ============================================
// App.jsx — Router + Auth Guard + Theme
// src/App.jsx
// ============================================
import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'

// Layout
import SuperAdminLayout from './components/layout/SuperAdminLayout'

// Pages
import Login       from './pages/Login'
import Dashboard   from './pages/Dashboard'
import Settings    from './pages/Settings'

// Cerco 3
import BusinessManager from './components/business/BusinessManager'

// ── Auth Guard ────────────────────────────────────────────────
function RequireAuth({ children, user }) {
  if (user === undefined) {
    // Still loading session
    return (
      <div className="min-h-screen bg-mesh flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500/50 border-t-indigo-400 rounded-full animate-spin" />
      </div>
    )
  }
  return user ? children : <Navigate to="/login" replace />
}

// ── App ───────────────────────────────────────────────────────
export default function App() {
  const [user,     setUser]     = useState(undefined) // undefined = loading
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem('sa-theme') !== 'light'
  )

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    )
    return () => subscription.unsubscribe()
  }, [])

  function toggleDark() {
    setDarkMode(prev => {
      const next = !prev
      localStorage.setItem('sa-theme', next ? 'dark' : 'light')
      return next
    })
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public route */}
        <Route path="/login" element={
          user ? <Navigate to="/" replace /> : <Login />
        } />

        {/* Protected routes */}
        <Route element={
          <RequireAuth user={user}>
            <SuperAdminLayout
              user={user}
              darkMode={darkMode}
              onToggleDark={toggleDark}
            />
          </RequireAuth>
        }>
          <Route index          element={<Dashboard />}        />
          <Route path="businesses" element={<BusinessManager />} />
          <Route path="settings"   element={<Settings />}       />
          {/* Fallback */}
          <Route path="*"          element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
