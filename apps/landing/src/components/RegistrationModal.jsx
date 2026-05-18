import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, User, Lock, ShieldCheck, AlertCircle, Loader2, Rocket, ArrowRight } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function RegistrationModal({ isOpen, onClose }) {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  if (!isOpen) return null

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Validaciones simples
    if (!form.name.trim()) {
      setError('Por favor, ingresa tu nombre completo.')
      setLoading(false)
      return
    }
    if (!form.email.trim() || !/^\S+@\S+\.\S+$/.test(form.email)) {
      setError('Por favor, ingresa un correo electrónico válido.')
      setLoading(false)
      return
    }
    if (form.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      setLoading(false)
      return
    }

    try {
      const mockDoc = 'PLG-' + Math.floor(100000 + Math.random() * 900000)
      const empresaName = form.name.trim() + ' Business'

      // Registrar usuario con Supabase Auth compartida
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          data: {
            nombre_completo: form.name.trim(),
            rol: 'admin_negocio',
            empresa: empresaName,
            documento: mockDoc
          }
        }
      })

      if (signUpError) {
        throw signUpError
      }

      setSuccess(true)
      
      // Redirigir a la app principal con parámetros PLG
      setTimeout(() => {
        // En producción redirigir al CRM real, en local o donde sea
        const targetUrl = `https://vendemas-crm.vercel.app/login?email=${encodeURIComponent(form.email.trim())}&registered=true&plg=true`
        window.location.href = targetUrl
      }, 2000)

    } catch (err) {
      console.error('Error in PLG registration:', err)
      setError(err.message || 'Error inesperado al crear tu cuenta.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        {/* Contenedor principal con animación */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-[95%] sm:w-full max-w-md max-h-[90vh] overflow-y-auto rounded-[2.5rem] border border-white/10 glass bg-slate-950 p-8 shadow-2xl"
        >
          {/* Botón de Cerrar */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={16} />
          </button>

          {success ? (
            /* Pantalla de Éxito */
            <div className="text-center py-10 space-y-6">
              <div className="w-20 h-20 bg-emerald-500/20 border border-emerald-500/30 rounded-[2rem] flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                <Rocket className="w-10 h-10 text-emerald-400 animate-bounce" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">¡Cuenta Creada!</h3>
                <p className="text-slate-400 font-medium">Provisionando tu CRM Starter Next-Gen 2035...</p>
              </div>
              <div className="flex items-center justify-center gap-2 text-indigo-400 text-sm font-bold">
                <Loader2 size={16} className="animate-spin" /> Redirigiendo al portal de acceso...
              </div>
            </div>
          ) : (
            /* Formulario */
            <div className="space-y-6">
              {/* Encabezado */}
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                  <ShieldCheck size={12} className="text-indigo-400" />
                  <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">PLG Instant Access</span>
                </div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Empezar Gratis</h3>
                <p className="text-slate-500 text-sm font-medium">Configura tu portal de negocio Starter en segundos.</p>
              </div>

              {/* Errores */}
              {error && (
                <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Formulario */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nombre */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Nombre Completo</label>
                  <div className="flex items-center gap-2.5 px-4 py-3.5 rounded-2xl bg-white/5 border border-white/5 focus-within:border-indigo-500/50 focus-within:bg-white/10 transition-all">
                    <User size={16} className="text-slate-500" />
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleInputChange}
                      placeholder="Juan Pérez"
                      className="flex-1 bg-transparent text-sm text-white placeholder-slate-600 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Correo Electrónico</label>
                  <div className="flex items-center gap-2.5 px-4 py-3.5 rounded-2xl bg-white/5 border border-white/5 focus-within:border-indigo-500/50 focus-within:bg-white/10 transition-all">
                    <Mail size={16} className="text-slate-500" />
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleInputChange}
                      placeholder="juan@empresa.com"
                      className="flex-1 bg-transparent text-sm text-white placeholder-slate-600 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Contraseña */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Contraseña</label>
                  <div className="flex items-center gap-2.5 px-4 py-3.5 rounded-2xl bg-white/5 border border-white/5 focus-within:border-indigo-500/50 focus-within:bg-white/10 transition-all">
                    <Lock size={16} className="text-slate-500" />
                    <input
                      type="password"
                      name="password"
                      value={form.password}
                      onChange={handleInputChange}
                      placeholder="Mínimo 8 caracteres"
                      className="flex-1 bg-transparent text-sm text-white placeholder-slate-600 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Botón Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-black rounded-2xl uppercase tracking-widest shadow-xl shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 mt-6 cursor-pointer"
                >
                  {loading ? (
                    <><Loader2 size={16} className="animate-spin" /> Creando cuenta...</>
                  ) : (
                    <><Rocket size={16} /> Crear mi cuenta gratis</>
                  )}
                </button>
              </form>

              {/* Pie de página modal */}
              <div className="pt-2 text-center text-[10px] text-slate-600 font-bold uppercase tracking-wider">
                Protegido por políticas de encriptación bancaria.
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
