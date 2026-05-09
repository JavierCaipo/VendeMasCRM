import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { User, Lock, Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'

export default function MiPerfilView() {
  const [loading, setLoading] = useState(true)
  const [isSavingName, setIsSavingName] = useState(false)
  const [isSavingPassword, setIsSavingPassword] = useState(false)
  
  const [email, setEmail] = useState('')
  const [nombreCompleto, setNombreCompleto] = useState('')
  const [nuevaPassword, setNuevaPassword] = useState('')
  const [userId, setUserId] = useState(null)

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        setEmail(user.email)
        
        const { data: dbUser } = await supabase
          .from('usuarios_negocio')
          .select('nombre_completo')
          .eq('id', user.id)
          .single()
          
        if (dbUser) {
          setNombreCompleto(dbUser.nombre_completo || '')
        }
      }
      setLoading(false)
    }
    loadProfile()
  }, [])

  const handleUpdateName = async (e) => {
    e.preventDefault()
    if (!nombreCompleto.trim()) return toast.error('El nombre no puede estar vacío')
    
    setIsSavingName(true)
    try {
      const { error } = await supabase
        .from('usuarios_negocio')
        .update({ nombre_completo: nombreCompleto })
        .eq('id', userId)
        
      if (error) throw error
      toast.success('Nombre actualizado correctamente')
    } catch (err) {
      toast.error('Error al actualizar nombre: ' + err.message)
    } finally {
      setIsSavingName(false)
    }
  }

  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    if (!nuevaPassword || nuevaPassword.length < 6) {
      return toast.error('La contraseña debe tener al menos 6 caracteres')
    }
    
    setIsSavingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: nuevaPassword
      })
      
      if (error) throw error
      
      toast.success('Contraseña actualizada correctamente')
      setNuevaPassword('')
    } catch (err) {
      toast.error('Error al actualizar contraseña: ' + err.message)
    } finally {
      setIsSavingPassword(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 fade-up">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
          <User size={26} className="text-indigo-400" />
          Mi Perfil
        </h1>
        <p className="text-slate-400 mt-1">Gestiona tu información personal y credenciales de acceso.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Sección 1: Información Personal */}
        <div className="glass rounded-3xl border border-white/10 p-6 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400">
              <User size={20} />
            </div>
            <h2 className="text-lg font-bold text-slate-200">Información Personal</h2>
          </div>
          
          <form onSubmit={handleUpdateName} className="space-y-4 flex-1 flex flex-col">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Email (Solo lectura)</label>
              <input 
                type="email" 
                value={email}
                disabled
                className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm text-slate-500 cursor-not-allowed"
              />
            </div>
            
            <div className="space-y-1.5 flex-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Nombre Completo</label>
              <input 
                type="text" 
                value={nombreCompleto}
                onChange={e => setNombreCompleto(e.target.value)}
                placeholder="Ej. Santiago Caipo"
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors"
              />
            </div>
            
            <button 
              type="submit"
              disabled={isSavingName}
              className="mt-auto w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSavingName ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Actualizar Perfil
            </button>
          </form>
        </div>

        {/* Sección 2: Seguridad */}
        <div className="glass rounded-3xl border border-white/10 p-6 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Lock size={20} />
            </div>
            <h2 className="text-lg font-bold text-slate-200">Seguridad</h2>
          </div>
          
          <form onSubmit={handleUpdatePassword} className="space-y-4 flex-1 flex flex-col">
            <div className="space-y-1.5 flex-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Nueva Contraseña</label>
              <input 
                type="password" 
                value={nuevaPassword}
                onChange={e => setNuevaPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors"
              />
            </div>
            
            <button 
              type="submit"
              disabled={isSavingPassword || !nuevaPassword.trim()}
              className="mt-auto w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/10 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSavingPassword ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Actualizar Contraseña
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
