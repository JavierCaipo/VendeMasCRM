// ============================================
// CERCO 2 — Ficha de Producto Profesional
// src/components/inventario/ProductoForm.jsx
// ============================================
import { useState, useEffect, useMemo } from 'react'
import { 
  Package, Hash as SKUIcon, Image as ImageIcon, FileText, 
  Warehouse, Loader2, Save, X, Plus, 
  Trash2, FileCheck, Info, Sparkles, AlertTriangle
} from 'lucide-react'
import imageCompression from 'browser-image-compression'
import { supabase } from '../../lib/supabaseClient'
import { useTenant } from '../../context/TenantContext'
import { useFreemium } from '../../hooks/useFreemium'
import PaywallModal from '../common/PaywallModal'

export default function ProductoForm({ isOpen, onClose, onSuccess, onError, productoToEdit }) {
  const { tenant } = useTenant()
  const { checkLimit } = useFreemium()
  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(true)
  const [categorias, setCategorias] = useState([])
  const [almacenes, setAlmacenes] = useState([])
  const [paywall, setPaywall] = useState({ open: false, reason: '' })

  const [formData, setFormData] = useState({
    nombre: '',
    sku: '',
    fabricante: '',
    categoria_id: '',
    moneda: 'PEN',
    descripcion: '',
    precio_a: '',
    precio_b: '',
    precio_c: '',
    fotos: [],
    url_ficha_tecnica: '',
    url_certificado_calidad: ''
  })

  const [stocks, setStocks] = useState({}) // { almacen_id: cantidad }
  const [uploading, setUploading] = useState({ images: false, docs: false })
  const [isPremiumLoading, setIsPremiumLoading] = useState(false)
  const [kardex, setKardex] = useState([])
  const [loadingKardex, setLoadingKardex] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadInitialData()
      if (productoToEdit) {
        console.log('Hydrating form with:', productoToEdit)
        setFormData({
          nombre: productoToEdit.nombre || '',
          sku: productoToEdit.sku || '',
          fabricante: productoToEdit.fabricante || '',
          categoria_id: productoToEdit.categoria_id || '',
          moneda: productoToEdit.moneda || 'PEN',
          descripcion: productoToEdit.descripcion || '',
          precio_a: productoToEdit.precio_a || '',
          precio_b: productoToEdit.precio_b || '',
          precio_c: productoToEdit.precio_c || '',
          fotos: productoToEdit.fotos || [],
          url_ficha_tecnica: productoToEdit.url_ficha_tecnica || '',
          url_certificado_calidad: productoToEdit.url_certificado_calidad || ''
        })
        
        // Hidratación de stock
        if (productoToEdit.stock && productoToEdit.stock.length > 0) {
          const stockMap = {}
          productoToEdit.stock.forEach(s => {
            if (s.almacen_id) stockMap[s.almacen_id] = s.stock_actual
          })
          setStocks(stockMap)
        } else if (productoToEdit.inventario) {
          const stockMap = {}
          productoToEdit.inventario.forEach(s => {
            if (s.almacen_id) stockMap[s.almacen_id] = s.stock_actual
          })
          setStocks(stockMap)
        } else {
          loadProductStock(productoToEdit.id)
        }
        
        // Fetch Kardex
        if (productoToEdit.id) {
          loadKardex(productoToEdit.id)
        }
      } else {
        setFormData({
          nombre: '', sku: '', fabricante: '', categoria_id: '', moneda: 'PEN',
          descripcion: '', precio_a: '', precio_b: '', precio_c: '', 
          fotos: [], url_ficha_tecnica: '', url_certificado_calidad: ''
        })
        setStocks({})
        setKardex([])
      }
    }
  }, [isOpen, productoToEdit])

  async function loadInitialData() {
    setFetchingData(true)
    const [cats, alms] = await Promise.all([
      supabase.from('categorias').select('*').eq('negocio_id', tenant.id).order('nombre'),
      supabase.from('almacenes').select('*').eq('negocio_id', tenant.id).order('nombre')
    ])
    setCategorias(cats.data || [])
    setAlmacenes(alms.data || [])
    setFetchingData(false)
  }

  async function loadProductStock(productId) {
    const { data } = await supabase
      .from('inventario')
      .select('almacen_id, stock_actual')
      .eq('producto_id', productId)
    
    if (data) {
      const stockMap = {}
      data.forEach(s => stockMap[s.almacen_id] = s.stock_actual)
      setStocks(stockMap)
    }
  }

  async function loadKardex(productId) {
    setLoadingKardex(true)
    const { data } = await supabase
      .from('movimientos_inventario')
      .select('*')
      .eq('producto_id', productId)
      .order('fecha_creacion', { ascending: false })
    setKardex(data || [])
    setLoadingKardex(false)
  }

  const kardexConSaldo = useMemo(() => {
    if (!kardex || kardex.length === 0) return [];
    // 1. Ordenar cronológicamente (más antiguo primero)
    const cronologico = [...kardex].sort((a, b) => new Date(a.fecha_creacion) - new Date(b.fecha_creacion));
    
    // 2. Calcular saldo arrastrado
    let saldoAcumulado = 0;
    const conSaldo = cronologico.map(mov => {
      saldoAcumulado = mov.tipo === 'INGRESO' ? saldoAcumulado + Number(mov.cantidad) : saldoAcumulado - Number(mov.cantidad);
      return { ...mov, saldo: saldoAcumulado };
    });

    // 3. Volver a ordenar para la vista (más reciente primero)
    return conSaldo.sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion));
  }, [kardex]);

  async function handleFileUpload(e, type) {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    // Para imágenes, solo guardamos el File en el estado local (Subida diferida)
    if (type === 'image') {
      setFormData(prev => ({ ...prev, fotos: [...prev.fotos, ...files] }))
      return
    }

    // Para PDFs, mantenemos subida inmediata por simplicidad
    setPremiumError(null)
    setUploading(prev => ({ ...prev, docs: true }))

    try {
      for (let file of files) {
        // --- Lógica Freemium para Archivos ---
        const limitStatus = checkLimit('FILE_SIZE', file.size)
        if (!limitStatus.allowed) {
          setPaywall({ open: true, reason: limitStatus.reason })
          setUploading(prev => ({ ...prev, docs: false }))
          return
        }

        let storagePath = 'uploads'
        const fileExt = file.name.split('.').pop()
        const fileName = `${tenant.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `${storagePath}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('productos')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('productos')
          .getPublicUrl(filePath)

        if (type === 'ficha') {
          setFormData(prev => ({ ...prev, url_ficha_tecnica: publicUrl }))
        } else if (type === 'certificado') {
          setFormData(prev => ({ ...prev, url_certificado_calidad: publicUrl }))
        }
      }
    } catch (err) {
      console.error('Error uploading doc:', err)
      onError?.(`Error al subir archivo: ${err.message}`)
    } finally {
      setUploading(prev => ({ ...prev, docs: false }))
      setIsPremiumLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)

    let urlsFinales = []

    // BLOQUE A: Multimedia (Storage)
    try {
      const existingUrls = formData.fotos.filter(img => typeof img === 'string')
      const newFiles = formData.fotos.filter(img => typeof img !== 'string')
      const newUrls = []

      for (const file of newFiles) {
        const options = { maxSizeMB: 1, maxWidthOrHeight: 1200, useWebWorker: true }
        const compressedFile = await imageCompression(file, options)
        
        const fileExt = file.name.split('.').pop()
        const fileName = `${tenant.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `uploads/${fileName}`

        const { error: uploadErr } = await supabase.storage
          .from('productos')
          .upload(filePath, compressedFile)

        if (uploadErr) throw uploadErr

        const { data: { publicUrl } } = supabase.storage
          .from('productos')
          .getPublicUrl(filePath)
          
        newUrls.push(publicUrl)
      }
      urlsFinales = [...existingUrls, ...newUrls]
    } catch (err) {
      console.error('Error crítico en Storage:', err)
      onError?.(`Error al subir imágenes: ${err.message}`)
      setLoading(false)
      return
    }

    // BLOQUE B: Persistencia (Base de Datos)
    try {
      const cleanPayload = {
        nombre: formData.nombre,
        sku: formData.sku,
        fabricante: formData.fabricante === "" ? null : formData.fabricante,
        categoria_id: formData.categoria_id === "" ? null : formData.categoria_id,
        moneda: formData.moneda,
        descripcion: formData.descripcion,
        precio_a: parseFloat(formData.precio_a) || 0,
        precio_b: parseFloat(formData.precio_b) || 0,
        precio_c: parseFloat(formData.precio_c) || 0,
        fotos: urlsFinales,
        url_ficha_tecnica: formData.url_ficha_tecnica === "" ? null : formData.url_ficha_tecnica,
        url_certificado_calidad: formData.url_certificado_calidad === "" ? null : formData.url_certificado_calidad,
        negocio_id: tenant.id
      }

      let productId = productoToEdit?.id

      if (productoToEdit) {
        const { error: updateErr } = await supabase
          .from('productos')
          .update(cleanPayload)
          .eq('id', productoToEdit.id)
          .eq('negocio_id', tenant.id)
        if (updateErr) throw updateErr
      } else {
        const { data: insertData, error: insertErr } = await supabase
          .from('productos')
          .insert([cleanPayload])
          .select()
        if (insertErr) throw insertErr
        productId = insertData[0].id
      }

      // Upsert de Inventario
      const stockPayload = Object.entries(stocks).map(([almacen_id, stock_actual]) => ({
        producto_id: productId,
        almacen_id,
        stock_actual: parseFloat(stock_actual) || 0
      }))

      if (stockPayload.length > 0) {
        const { error: stockErr } = await supabase
          .from('inventario')
          .upsert(stockPayload, { onConflict: 'producto_id,almacen_id' })
        if (stockErr) throw stockErr
      }

      onSuccess?.(productoToEdit ? 'Producto actualizado correctamente' : 'Producto creado exitosamente')
      onClose()
    } catch (err) {
      console.error('Error crítico en Base de Datos:', err)
      onError?.(`Error en BD: ${err.message || JSON.stringify(err)}`)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <div className="relative bg-[#0B0F19] border border-slate-700 shadow-2xl rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col fade-up">
        
        {/* Header */}
        <div className="px-8 py-5 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
              <Package size={24} className="text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100">
                {productoToEdit ? 'Editar Producto' : 'Ficha de Nuevo Producto'}
              </h2>
              <p className="text-xs text-slate-400">Gestión profesional de activos comerciales</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-white/10 transition-all">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
          
          {/* SECCIÓN 1: Información Básica */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
              <Info size={16} /> Información del Producto
            </div>
            
            <div className="space-y-6">
              {/* Fila 1: Nombre */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Nombre del Producto *</label>
                <input
                  required
                  value={formData.nombre}
                  onChange={e => setFormData(p => ({ ...p, nombre: e.target.value }))}
                  className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-base text-slate-100 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                  placeholder="Ej: Rodamiento Industrial SF-200"
                />
              </div>

              {/* Fila 2: SKU, Fabricante, Categoría */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">SKU / Código</label>
                  <input
                    value={formData.sku}
                    onChange={e => setFormData(p => ({ ...p, sku: e.target.value }))}
                    className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-sm font-mono text-indigo-300 focus:outline-none focus:border-indigo-500/50"
                    placeholder="SF-200-XP"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Fabricante / Marca</label>
                  <input
                    value={formData.fabricante}
                    onChange={e => setFormData(p => ({ ...p, fabricante: e.target.value }))}
                    className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-sm text-slate-100 focus:outline-none focus:border-indigo-500/50"
                    placeholder="Ej: SKF, Siemens..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Categoría</label>
                  <select
                    value={formData.categoria_id}
                    onChange={e => setFormData(p => ({ ...p, categoria_id: e.target.value }))}
                    className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-sm text-slate-100 focus:outline-none focus:border-indigo-500/50 appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-slate-900 text-slate-500">Seleccionar...</option>
                    {categorias.map(c => (
                      <option key={c.id} value={c.id} className="bg-slate-900">{c.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Fila 3: Moneda y Tarifas */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6 rounded-3xl bg-white/5 border border-white/5">
                <div>
                  <label className="block text-xs font-bold text-indigo-400/80 mb-2 uppercase tracking-wider">Moneda</label>
                  <select
                    value={formData.moneda}
                    onChange={e => setFormData(p => ({ ...p, moneda: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-sm font-bold text-indigo-100 focus:outline-none"
                  >
                    <option value="PEN" className="bg-slate-900">Soles (PEN)</option>
                    <option value="USD" className="bg-slate-900">Dólares (USD)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-widest text-center">Precio A (Mayorista)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.precio_a}
                      onChange={e => setFormData(p => ({ ...p, precio_a: e.target.value }))}
                      className="w-full pl-8 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-emerald-400 font-bold focus:border-emerald-500/50 transition-all text-center"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-widest text-center">Precio B (Especial)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.precio_b}
                      onChange={e => setFormData(p => ({ ...p, precio_b: e.target.value }))}
                      className="w-full pl-8 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-emerald-400 font-bold focus:border-emerald-500/50 transition-all text-center"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-widest text-center">Precio C (Normal)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.precio_c}
                      onChange={e => setFormData(p => ({ ...p, precio_c: e.target.value }))}
                      className="w-full pl-8 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-emerald-400 font-bold focus:border-emerald-500/50 transition-all text-center"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Fila 4: Descripción */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Descripción Detallada</label>
                <textarea
                  value={formData.descripcion}
                  onChange={e => setFormData(p => ({ ...p, descripcion: e.target.value }))}
                  className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-sm text-slate-300 focus:outline-none focus:border-indigo-500/50 h-32 resize-none leading-relaxed"
                  placeholder="Especificaciones técnicas, dimensiones, material..."
                />
              </div>
            </div>
          </section>

          {/* SECCIÓN 2: Media & Documentos */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
              <ImageIcon size={16} /> Multimedia y Documentación
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Fotos */}
              <div className="space-y-3">
                <label className="block text-xs font-medium text-slate-400">Galería de Imágenes</label>
                <div className="flex flex-wrap gap-3">
                  {formData.fotos.map((url, i) => (
                    <div key={i} className="relative group w-20 h-20 rounded-xl overflow-hidden border border-white/10 glass">
                      <img 
                        src={typeof url === 'string' ? url : URL.createObjectURL(url)} 
                        className="w-full h-full object-cover" 
                      />
                      <button 
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, fotos: p.fotos.filter((_, idx) => idx !== i) }))}
                        className="absolute inset-0 bg-red-500/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                      >
                        <Trash2 size={16} className="text-white" />
                      </button>
                    </div>
                  ))}
                  <label className="w-20 h-20 rounded-xl border-2 border-dashed border-white/10 hover:border-indigo-500/40 hover:bg-white/5 flex flex-col items-center justify-center cursor-pointer transition-all group">
                    <input type="file" multiple accept="image/*" className="hidden" onChange={e => handleFileUpload(e, 'image')} />
                    {uploading.images ? <Loader2 size={16} className="animate-spin text-indigo-400" /> : <Plus size={20} className="text-slate-500 group-hover:text-indigo-400" />}
                  </label>
                </div>
              </div>

              {/* Documentos */}
              <div className="space-y-4">
                <div className="flex flex-col gap-3">
                  {/* Ficha Técnica */}
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10 relative overflow-hidden group">
                    {isPremiumLoading && (
                      <div className="absolute inset-0 bg-indigo-600/20 backdrop-blur-sm flex items-center justify-center z-10">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-white">
                          <Loader2 size={12} className="animate-spin" /> Optimizando documento premium... ⚡
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400"><FileText size={16} /></div>
                      <div>
                        <p className="text-[11px] font-bold text-slate-200">Ficha Técnica</p>
                        <p className="text-[10px] text-slate-500">{formData.url_ficha_tecnica ? 'Archivo cargado' : 'No seleccionado'}</p>
                      </div>
                    </div>
                    <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold text-slate-300 transition-all">
                      {formData.url_ficha_tecnica ? 'Reemplazar' : 'Subir'}
                      <input type="file" accept=".pdf" className="hidden" onChange={e => handleFileUpload(e, 'ficha')} />
                    </label>
                  </div>

                  {/* Certificado */}
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400"><FileCheck size={16} /></div>
                      <div>
                        <p className="text-[11px] font-bold text-slate-200">Certificado Calidad</p>
                        <p className="text-[10px] text-slate-500">{formData.url_certificado_calidad ? 'Archivo cargado' : 'No seleccionado'}</p>
                      </div>
                    </div>
                    <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold text-slate-300 transition-all">
                      {formData.url_certificado_calidad ? 'Reemplazar' : 'Subir'}
                      <input type="file" accept=".pdf" className="hidden" onChange={e => handleFileUpload(e, 'certificado')} />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SECCIÓN 3: Control de Inventario */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
              <Warehouse size={16} /> Stock Inicial por Almacén
            </div>
            <div className="glass rounded-2xl border border-white/10 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-3 text-slate-400 font-semibold text-xs">Almacén</th>
                    <th className="px-6 py-3 text-slate-400 font-semibold text-xs">Stock Inicial</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {almacenes.length === 0 ? (
                    <tr>
                      <td colSpan="2" className="px-6 py-4 text-slate-500 text-xs italic">No hay almacenes creados.</td>
                    </tr>
                  ) : almacenes.map(alm => (
                    <tr key={alm.id}>
                      <td className="px-6 py-4 text-slate-200 text-xs font-medium">{alm.nombre}</td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          min="0"
                          value={stocks[alm.id] || ''}
                          onChange={e => setStocks(s => ({ ...s, [alm.id]: e.target.value }))}
                          placeholder="0"
                          className="w-24 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-indigo-400 text-center focus:outline-none focus:border-indigo-500/50"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* SECCIÓN 4: Historial (Kardex) */}
          {productoToEdit && (
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
                <FileText size={16} /> Historial (Kardex)
              </div>
              <div className="glass rounded-2xl border border-white/10 overflow-hidden">
                {loadingKardex ? (
                  <div className="p-6 text-center text-slate-400 text-xs"><Loader2 className="animate-spin inline-block mr-2" size={14}/>Cargando Kardex...</div>
                ) : kardex.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 text-xs italic">No hay movimientos registrados para este producto.</div>
                ) : (
                  <div className="max-h-60 overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-white/5 border-b border-white/10 sticky top-0 backdrop-blur-md">
                        <tr>
                          <th className="px-6 py-3 text-slate-400 font-semibold text-[10px] uppercase tracking-wider">Fecha</th>
                          <th className="px-6 py-3 text-slate-400 font-semibold text-[10px] uppercase tracking-wider">Tipo</th>
                          <th className="px-6 py-3 text-slate-400 font-semibold text-[10px] uppercase tracking-wider">Cant.</th>
                          <th className="px-6 py-3 text-slate-400 font-semibold text-[10px] uppercase tracking-wider">Ref.</th>
                          <th className="px-6 py-3 text-slate-400 font-semibold text-[10px] uppercase tracking-wider">Saldo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {kardexConSaldo.map(mov => (
                          <tr key={mov.id}>
                            <td className="px-6 py-3 text-slate-300 text-[11px]">
                              {new Date(mov.fecha_creacion).toLocaleString()}
                            </td>
                            <td className="px-6 py-3">
                              <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${mov.tipo === 'INGRESO' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                                {mov.tipo}
                              </span>
                            </td>
                            <td className="px-6 py-3 text-slate-200 text-xs font-bold">{mov.cantidad}</td>
                            <td className="px-6 py-3 text-slate-400 text-[11px] truncate max-w-[150px]" title={mov.referencia || '-'}>{mov.referencia || '-'}</td>
                            <td className="px-6 py-3 text-indigo-400 text-xs font-black">{mov.saldo}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          )}

        </form>

        {/* Footer Actions */}
        <div className="px-8 py-5 border-t border-white/10 bg-white/5 flex gap-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-3 rounded-2xl text-sm font-bold text-slate-300 glass border border-white/10 hover:bg-white/10 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || uploading.images || uploading.docs}
            className="flex-[2] px-6 py-3 rounded-2xl text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> Guardar Ficha Técnica</>}
          </button>
        </div>

        {/* ── Paywall Modal ── */}
      <PaywallModal 
        isOpen={paywall.open} 
        onClose={() => setPaywall({ open: false, reason: '' })} 
        reason={paywall.reason} 
      />

    </div>
    </div>
  )
}
