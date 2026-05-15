import { useState, useEffect } from 'react'
import { X, Users, Plus, Trash2, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'

export default function ContactosModal({ isOpen, onClose, cliente }) {
  const [contactos, setContactos] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ nombre_completo: '', cargo: '', email: '', telefono: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen && cliente) {
      fetchContactos()
    } else {
      setContactos([])
    }
  }, [isOpen, cliente])

  async function fetchContactos() {
    setLoading(true)
    const { data, error } = await supabase
      .from('cliente_contactos')
      .select('*')
      .eq('cliente_id', cliente.id)
      .order('nombre_completo')
    
    if (!error) {
      setContactos(data || [])
    }
    setLoading(false)
  }

  async function handleAdd(e) {
    e.preventDefault()
    if (!form.nombre_completo.trim()) return

    setSaving(true)
    const { error } = await supabase
      .from('cliente_contactos')
      .insert([{ ...form, cliente_id: cliente.id }])
    
    if (!error) {
      setForm({ nombre_completo: '', cargo: '', email: '', telefono: '' })
      fetchContactos()
    }
    setSaving(false)
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este contacto?')) return
    await supabase.from('cliente_contactos').delete().eq('id', id)
    fetchContactos()
  }

  if (!isOpen || !cliente) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* SIBLING 1: Backdrop */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose} />
      {/* SIBLING 2: Card */}
      <div className="relative z-10 glass border border-white/15 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden fade-up max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <Users size={18} className="text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                Contactos de {cliente.nombre_razon_social}
              </h2>
              <p className="text-xs text-slate-400">Directorio B2B asociado a esta cuenta</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/10 transition-all">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Formulario Agregar */}
          <div className="md:col-span-1 border-r border-white/10 pr-6">
            <h3 className="text-sm font-bold text-slate-300 mb-4">Añadir Contacto</h3>
            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className="block text-[10px] font-medium text-slate-400 mb-1">Nombre Completo <span className="text-indigo-400">*</span></label>
                <input
                  required
                  value={form.nombre_completo}
                  onChange={e => setForm({...form, nombre_completo: e.target.value})}
                  className="w-full px-3 py-2 rounded-xl text-xs text-slate-100 bg-white/5 border border-white/10 focus:outline-none focus:border-emerald-500/60"
                  placeholder="Ej: Carlos Gómez"
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-slate-400 mb-1">Cargo</label>
                <input
                  value={form.cargo}
                  onChange={e => setForm({...form, cargo: e.target.value})}
                  className="w-full px-3 py-2 rounded-xl text-xs text-slate-100 bg-white/5 border border-white/10 focus:outline-none focus:border-emerald-500/60"
                  placeholder="Ej: Gerente de Compras"
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})}
                  className="w-full px-3 py-2 rounded-xl text-xs text-slate-100 bg-white/5 border border-white/10 focus:outline-none focus:border-emerald-500/60"
                  placeholder="carlos@empresa.com"
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-slate-400 mb-1">Teléfono</label>
                <input
                  value={form.telefono}
                  onChange={e => setForm({...form, telefono: e.target.value})}
                  className="w-full px-3 py-2 rounded-xl text-xs text-slate-100 bg-white/5 border border-white/10 focus:outline-none focus:border-emerald-500/60"
                  placeholder="+51 999..."
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full mt-2 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Añadir
              </button>
            </form>
          </div>

          {/* Lista de Contactos */}
          <div className="md:col-span-2 flex flex-col max-h-[300px]">
            <h3 className="text-sm font-bold text-slate-300 mb-4">Directorio Actual</h3>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
              {loading ? (
                <div className="flex justify-center p-4"><Loader2 size={20} className="animate-spin text-slate-500" /></div>
              ) : contactos.length === 0 ? (
                <div className="text-center p-4 text-xs text-slate-500 italic">No hay contactos registrados en esta cuenta.</div>
              ) : (
                contactos.map(c => (
                  <div key={c.id} className="p-3 rounded-xl bg-white/5 border border-white/10 flex justify-between items-start group">
                    <div>
                      <p className="text-xs font-bold text-slate-200">{c.nombre_completo}</p>
                      {c.cargo && <p className="text-[10px] text-slate-400 font-medium">{c.cargo}</p>}
                      <div className="mt-1 flex gap-3 text-[10px] text-slate-500">
                        {c.email && <span>{c.email}</span>}
                        {c.telefono && <span>{c.telefono}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="p-1.5 rounded bg-red-500/10 text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all"
                      title="Eliminar Contacto"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
