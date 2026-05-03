// ============================================
// CERCO 4 — Router Refactorizado
// src/App.jsx
// ============================================
import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'
import { TenantProvider } from './context/TenantContext'
import { Toaster } from 'sonner'

import DashboardLayout from './layouts/DashboardLayout'
import RegistroView    from './pages/RegistroView'
import LoginView       from './pages/LoginView'
import DashboardView   from './pages/DashboardView'
import ConfiguracionView from './pages/ConfiguracionView'
import ClientesView      from './pages/ClientesView'
import CatalogoView      from './pages/inventario/CatalogoView'
import CategoriasView    from './pages/inventario/CategoriasView'
import AlmacenesView     from './pages/inventario/AlmacenesView'
import CotizacionesView  from './pages/ventas/CotizacionesView'
import NuevaCotizacion   from './pages/ventas/NuevaCotizacion'
import PublicQuoteView   from './pages/public/PublicQuoteView'
import PipelineView      from './pages/crm/PipelineView'
import SuperAdminConfig from './pages/SuperAdminConfig'
import Equipo           from './pages/Equipo'



// ── Auth Guard ─────────────────────────────────────────────────
function RequireAuth({ user, children }) {
  if (user === undefined) {
    return (
      <div className="bg-mesh min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500/40 border-t-indigo-400 rounded-full animate-spin" />
      </div>
    )
  }
  return user ? children : <Navigate to="/login" replace />
}

// ── Placeholders ───────────────────────────────────────────────
function PlaceholderView({ title }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-slate-500 fade-up">
      <h2 className="text-xl font-bold text-slate-300 mb-2">{title}</h2>
      <p className="text-sm">🚧 Módulo en construcción</p>
    </div>
  )
}

// ── App ────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    )

    return () => subscription.unsubscribe()
  }, [])

  return (
    <BrowserRouter>
      <Toaster position="top-right" expand={true} richColors theme="dark" />
      <Routes>
        {/* Ruta pública */}
        <Route
          path="/login"
          element={
            user && user !== undefined
              ? <Navigate to="/" replace />
              : <LoginView />
          }
        />
        <Route
          path="/registro"
          element={
            user && user !== undefined
              ? <Navigate to="/" replace />
              : <RegistroView />
          }
        />

        <Route path="/c/:id" element={<PublicQuoteView />} />

        {/* Rutas privadas envueltas en TenantProvider y DashboardLayout */}
        <Route
          path="/"
          element={
            <RequireAuth user={user}>
              <TenantProvider>
                <DashboardLayout />
              </TenantProvider>
            </RequireAuth>
          }
        >
          {/* Subrutas inyectadas en el <Outlet /> del DashboardLayout */}
          <Route index element={<DashboardView />} />
          <Route path="configuracion" element={<ConfiguracionView />} />
          
          <Route path="catalogo" element={<CatalogoView />} />
          <Route path="categorias" element={<CategoriasView />} />
          <Route path="almacenes" element={<AlmacenesView />} />
          <Route path="clientes" element={<ClientesView />} />

          <Route path="cotizaciones" element={<CotizacionesView />} />
          <Route path="cotizaciones/nueva" element={<NuevaCotizacion />} />
          
          <Route path="pipeline" element={<PipelineView />} />
          <Route path="saas-config" element={<SuperAdminConfig />} />
          <Route path="equipo" element={<Equipo />} />


        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
