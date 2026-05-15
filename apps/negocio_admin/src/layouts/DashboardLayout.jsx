// ============================================
// CERCO 2 — Layout del Negocio
// src/layouts/DashboardLayout.jsx
// ============================================
import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, PackageSearch, Users, Settings, LogOut,
  Building2, Menu, X, Tags, Warehouse, FileText, Kanban, User, DollarSign, Shield
} from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useTenant } from '../context/TenantContext'

const NAV_ITEMS = [
  { path: '/',              label: 'Dashboard',     icon: LayoutDashboard, rolesAllowed: ['superadmin', 'admin_negocio', 'user'] },
  { path: '/clientes',      label: 'Clientes',      icon: Users,           rolesAllowed: ['superadmin', 'admin_negocio', 'user'] },
  {
    group: 'Ventas', icon: DollarSign, rolesAllowed: ['superadmin', 'admin_negocio', 'user'], items: [
      { path: '/pipeline',     label: 'Pipeline',     icon: Kanban,        rolesAllowed: ['superadmin', 'admin_negocio', 'user'] },
      { path: '/cotizaciones', label: 'Cotizaciones', icon: FileText,      rolesAllowed: ['superadmin', 'admin_negocio', 'user'] },
    ]
  },
  {
    group: 'Inventario', icon: PackageSearch, rolesAllowed: ['superadmin', 'admin_negocio', 'user'], items: [
      { path: '/catalogo',    label: 'Catálogo',      icon: PackageSearch, rolesAllowed: ['superadmin', 'admin_negocio', 'user'] },
      { path: '/categorias',  label: 'Categorías',    icon: Tags,          rolesAllowed: ['superadmin', 'admin_negocio', 'user'] },
      { path: '/almacenes',   label: 'Almacenes',     icon: Warehouse,     rolesAllowed: ['superadmin', 'admin_negocio', 'user'] },
    ]
  },
  {
    group: 'Administración', icon: Shield, rolesAllowed: ['superadmin', 'admin_negocio'], items: [
      { path: '/equipo',       label: 'Equipo',        icon: Users,        rolesAllowed: ['superadmin', 'admin_negocio'] },
    ]
  },
  { path: '/configuracion', label: 'Configuración', icon: Settings,        rolesAllowed: ['superadmin', 'admin_negocio'] },
]

export default function DashboardLayout() {
  const { tenant } = useTenant()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [userName, setUserName] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)

  // Filtrado de items de navegación basado en el rol
  const filteredNavItems = NAV_ITEMS.map(item => {
    if (item.group) {
      const allowedItems = item.items.filter(sub => sub.rolesAllowed?.includes(userRole))
      if (allowedItems.length === 0) return null
      return { ...item, items: allowedItems }
    }
    if (item.rolesAllowed && !item.rolesAllowed.includes(userRole)) return null
    return item
  }).filter(Boolean)

  useEffect(() => {
    async function fetchAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: dbUser } = await supabase.from('usuarios_negocio').select('rol, nombre_completo').eq('id', user.id).single()
        setUserRole(dbUser?.rol || 'user')
        setUserName(dbUser?.nombre_completo)
        setUser(user)
      } else {
        setUserRole('user')
      }
      setIsLoadingAuth(false)
    }
    fetchAuth()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login') 
  }

  function SidebarLink({ path, label, icon: Icon, onClick }) {
    return (
      <NavLink
        to={path}
        onClick={onClick}
        className={({ isActive }) => `
          flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
          ${isActive
            ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 shadow-lg shadow-indigo-500/5'
            : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'
          }
        `}
      >
        <Icon size={16} className="flex-shrink-0" />
        {label}
      </NavLink>
    )
  }

  return (
    <div className="bg-mesh min-h-screen flex overflow-hidden">
      
      {/* ── Sidebar (Desktop) ── */}
      <aside className="hidden md:flex flex-col w-64 glass border-r border-white/10 z-20">
        {/* Logo / Branding */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-white/5">
          {tenant.logo_url ? (
            <img src={tenant.logo_url} className="h-8 w-auto object-contain" alt={tenant.nombre} />
          ) : (
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-400 text-xs">
              {tenant.nombre?.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="font-bold text-slate-100 tracking-tight truncate">{tenant.nombre}</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
          {isLoadingAuth ? (
            <div className="px-3 py-2 text-sm text-slate-500 italic animate-pulse">
              Cargando menú...
            </div>
          ) : (
            filteredNavItems.map((item) => {
              if (item.group) {
                return (
                  <div key={item.group} className="pt-4 space-y-1">
                    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2 px-2">
                      {item.group}
                    </div>
                    {item.items.map((subItem) => (
                      <SidebarLink key={subItem.path} {...subItem} />
                    ))}
                  </div>
                )
              }
              return <SidebarLink key={item.path} {...item} />
            })
          )}
        </nav>
      </aside>

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        
        {/* Header */}
        <header className="h-16 glass border-b border-white/10 flex items-center justify-between px-4 md:px-6 z-10 sticky top-0">
          
          <div className="flex items-center gap-3">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg text-slate-400 hover:bg-white/10 transition-colors"
            >
              <Menu size={20} />
            </button>
            
            {/* Tenant Info */}
            <div className="flex flex-col">
              <h2 className="text-sm font-bold text-slate-100 leading-tight tracking-tight">
                {tenant.nombre}
              </h2>
            </div>
          </div>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/perfil')}
              title="Mi Perfil"
              style={{ display: 'flex', position: 'relative', zIndex: 999 }}
              className="cursor-pointer items-center gap-2 px-3 py-1.5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors"
            >
              <User size={14} className="text-indigo-400" />
              <span className="text-xs font-medium text-slate-300">
                {userName || user?.email}
              </span>
            </button>
            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              className="flex items-center justify-center w-9 h-9 rounded-xl border border-white/10 text-slate-400 hover:bg-red-500/15 hover:text-red-400 hover:border-red-500/30 transition-all"
            >
              <LogOut size={15} />
            </button>
          </div>
        </header>

        {/* Scrollable Canvas for Pages */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
          <Outlet />
        </main>
      </div>

      {/* ── Mobile Sidebar Overlay ── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-2xl" onClick={() => setMobileMenuOpen(false)} />
          <aside className="w-64 max-w-[80%] h-full glass border-r border-white/10 relative flex flex-col animate-in slide-in-from-left-full">
            <div className="h-16 flex items-center justify-between px-6 border-b border-white/5">
              <div className="flex items-center gap-2">
                {tenant.logo_url ? (
                  <img src={tenant.logo_url} className="h-6 w-auto object-contain" alt={tenant.nombre} />
                ) : (
                  <div className="w-6 h-6 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-400 text-[10px]">
                    {tenant.nombre?.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="font-bold text-slate-100 text-sm truncate">{tenant.nombre}</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400 p-1">
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
              {isLoadingAuth ? (
                <div className="px-3 py-2 text-sm text-slate-500 italic animate-pulse">
                  Cargando menú...
                </div>
              ) : (
                filteredNavItems.map((item) => {
                  if (item.group) {
                    return (
                      <div key={item.group} className="pt-2 space-y-1">
                        <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2 px-2">
                          {item.group}
                        </div>
                        {item.items.map((subItem) => (
                          <SidebarLink key={subItem.path} {...subItem} onClick={() => setMobileMenuOpen(false)} />
                        ))}
                      </div>
                    )
                  }
                  return <SidebarLink key={item.path} {...item} onClick={() => setMobileMenuOpen(false)} />
                })
              )}
            </nav>
          </aside>
        </div>
      )}

      {/* ── Barra de Navegación Inferior (Móvil) ── */}
      <div className="fixed bottom-0 left-0 w-full flex justify-around items-center md:hidden bg-slate-950 border-t border-slate-800 z-50 px-2 py-3 pb-safe shadow-2xl">
        <NavLink to="/" className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-400 transition-colors'}`}>
          <LayoutDashboard size={20} />
          <span className="text-[10px] font-bold">Resumen</span>
        </NavLink>
        <NavLink to="/pipeline" className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-400 transition-colors'}`}>
          <Kanban size={20} />
          <span className="text-[10px] font-bold">Pipeline</span>
        </NavLink>
        <NavLink to="/clientes" className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-400 transition-colors'}`}>
          <Users size={20} />
          <span className="text-[10px] font-bold">Clientes</span>
        </NavLink>
        <NavLink to="/cotizaciones" className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-400 transition-colors'}`}>
          <FileText size={20} />
          <span className="text-[10px] font-bold">Cotizaciones</span>
        </NavLink>
      </div>
    </div>
  )
}
