// ============================================
// CERCO 2 — SuperAdmin Layout (UI Base)
// src/components/layout/SuperAdminLayout.jsx
// ============================================
import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Building2,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  Bell,
  Sun,
  Moon,
  Menu,
  X,
} from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'

const NAV_ITEMS = [
  { to: '/',            icon: LayoutDashboard, label: 'Dashboard'   },
  { to: '/businesses',  icon: Building2,       label: 'Negocios'    },
  { to: '/settings',    icon: Settings,        label: 'Configuración'},
]

export default function SuperAdminLayout({ user, darkMode, onToggleDark }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const linkBase =
    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group'
  const linkActive =
    'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
  const linkInactive =
    'text-slate-400 hover:text-slate-100 hover:bg-white/5'

  return (
    <div className={`flex flex-col md:flex-row h-screen w-screen overflow-hidden bg-mesh ${darkMode ? 'dark' : ''}`}>

      {/* ── MOBILE HEADER ── */}
      <div className="flex md:hidden items-center justify-between px-4 py-3 glass border-b border-white/10 z-30 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-white transition-all bg-white/5 active:scale-95"
            aria-label="Abrir menú"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
              <Shield size={16} className="text-indigo-400" />
            </div>
            <span className="text-xs font-black text-slate-100 uppercase tracking-wider">SuperAdmin</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleDark}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 transition-all"
            title="Alternar tema"
          >
            {darkMode ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <div className="w-7 h-7 rounded-lg bg-indigo-500/30 flex items-center justify-center">
            <span className="text-xs font-bold text-indigo-300">
              {user?.email?.[0]?.toUpperCase() ?? 'S'}
            </span>
          </div>
        </div>
      </div>

      {/* ── MOBILE DRAWER (SIDEBAR OVERLAY) ── */}
      <div 
        className={`
          fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm transition-all duration-300 md:hidden
          ${mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
        onClick={() => setMobileOpen(false)}
      >
        <aside
          className={`
            fixed top-0 bottom-0 left-0 w-[240px] bg-slate-950 border-r border-white/10 z-50 flex flex-col p-4 transition-transform duration-300 ease-in-out
            ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                <Shield size={16} className="text-indigo-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-white uppercase tracking-wider leading-tight">SuperAdmin</p>
                <p className="text-[9px] text-slate-500">Panel de Control</p>
              </div>
            </div>
            <button 
              onClick={() => setMobileOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-white/5"
            >
              <X size={16} />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 space-y-1">
            {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <Icon size={18} />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Drawer Footer / Logout */}
          <button
            onClick={() => {
              setMobileOpen(false);
              handleLogout();
            }}
            className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20 mt-auto"
          >
            <LogOut size={18} />
            <span>Cerrar sesión</span>
          </button>
        </aside>
      </div>

      {/* ── SIDEBAR (DESKTOP) ── */}
      <aside
        className={`
          hidden md:flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out glass
          ${collapsed ? 'w-[68px]' : 'w-[220px]'}
          border-r border-white/10 z-20
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex-shrink-0">
            <Shield size={18} className="text-indigo-400" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-slate-100 leading-tight whitespace-nowrap">SuperAdmin</p>
              <p className="text-[10px] text-slate-400 whitespace-nowrap">Control Panel</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkInactive} ${collapsed ? 'justify-center' : ''}`
              }
              title={collapsed ? label : undefined}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center py-3 border-t border-white/10 text-slate-400 hover:text-slate-200 transition-colors"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </aside>

      {/* ── MAIN AREA ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* ── HEADER (DESKTOP ONLY) ── */}
        <header className="hidden md:flex glass border-b border-white/10 items-center justify-between px-6 py-3 flex-shrink-0 z-10">
          <div>
            <h1 className="text-base font-semibold text-slate-100">Panel de Administración</h1>
            <p className="text-xs text-slate-400">Gestión Global del SaaS</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Dark mode toggle */}
            <button
              onClick={onToggleDark}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all"
              title="Alternar tema"
            >
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Notifications */}
            <button className="relative p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all">
              <Bell size={16} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-indigo-400 rounded-full pulse-dot" />
            </button>

            {/* User */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass border border-white/10">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/30 flex items-center justify-center">
                <span className="text-xs font-bold text-indigo-300">
                  {user?.email?.[0]?.toUpperCase() ?? 'S'}
                </span>
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-medium text-slate-200 leading-tight max-w-[140px] truncate">
                  {user?.email ?? 'superadmin'}
                </p>
                <p className="text-[10px] text-indigo-400">Super Admin</p>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
              title="Cerrar sesión"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* ── CONTENT ── */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
