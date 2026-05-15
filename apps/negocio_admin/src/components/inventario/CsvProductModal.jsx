// ============================================
// CERCO 1 — Importador Masivo de Productos
// src/components/inventario/CsvProductModal.jsx
// ============================================
import { useState } from 'react'
import { X, FileUp, Download, Loader2, CheckCircle2, AlertCircle, FileSpreadsheet } from 'lucide-react'
import Papa from 'papaparse'
import { supabase } from '../../lib/supabaseClient'
import { useTenant } from '../../context/TenantContext'

export default function CsvProductModal({ isOpen, onClose, onSuccess, onError }) {
  const { tenant } = useTenant()
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState([])
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (!selectedFile) return
    setFile(selectedFile)

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setPreview(results.data.slice(0, 5))
      }
    })
  }

  const descargarPlantilla = () => {
    const headers = "sku,nombre,descripcion,precio_a,precio_b,precio_c\n"
    const blob = new Blob([headers], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", "plantilla_productos_vendemas.csv")
    link.click()
  }

  const handleImport = async () => {
    if (!file) return
    setLoading(true)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const products = results.data.map(row => ({
          ...row,
          negocio_id: tenant.id,
          precio_a: parseFloat(row.precio_a) || 0,
          precio_b: parseFloat(row.precio_b) || 0,
          precio_c: parseFloat(row.precio_c) || 0
        }))

        const { error } = await supabase
          .from('productos')
          .upsert(products, { onConflict: 'negocio_id, sku' })

        if (error) {
          onError?.(error.message)
        } else {
          onSuccess?.(`Catálogo procesado con éxito. Se crearon o actualizaron ${products.length} productos.`)
          onClose()
        }
        setLoading(false)
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="relative bg-[#0B0F19] border border-slate-700 shadow-2xl rounded-3xl w-full max-w-2xl overflow-hidden fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <FileSpreadsheet size={20} className="text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Importar Productos</h2>
              <p className="text-xs text-slate-400">Carga masiva mediante archivo CSV</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-white/10 transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-400">Paso 1: Descarga la plantilla y complétala con tus productos.</p>
            <button 
              onClick={descargarPlantilla}
              className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 uppercase tracking-widest transition-colors"
            >
              <Download size={14} /> Descargar Plantilla
            </button>
          </div>

          <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-white/10 rounded-3xl cursor-pointer hover:bg-white/5 transition-all group">
            <input type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
            <FileUp size={32} className="text-slate-500 group-hover:text-indigo-400 transition-colors mb-2" />
            <p className="text-sm text-slate-300 font-medium">
              {file ? file.name : "Seleccionar archivo CSV"}
            </p>
            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">Formato UTF-8 recomendado</p>
          </label>

          {preview.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Previsualización (primeras 5 filas):</p>
              <div className="glass rounded-xl border border-white/10 overflow-x-auto">
                <table className="w-full text-left text-[10px]">
                  <thead className="bg-white/5 border-b border-white/10 text-slate-500">
                    <tr>
                      <th className="px-4 py-2">SKU</th>
                      <th className="px-4 py-2">Nombre</th>
                      <th className="px-4 py-2">P. A</th>
                      <th className="px-4 py-2">P. B</th>
                      <th className="px-4 py-2">P. C</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {preview.map((row, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2 text-indigo-400 font-mono">{row.sku}</td>
                        <td className="px-4 py-2 text-slate-300">{row.nombre}</td>
                        <td className="px-4 py-2 text-slate-300">${row.precio_a}</td>
                        <td className="px-4 py-2 text-slate-300">${row.precio_b}</td>
                        <td className="px-4 py-2 text-slate-300">${row.precio_c}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="px-8 py-5 border-t border-white/10 bg-white/5 flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 rounded-2xl text-sm font-bold text-slate-300 glass border border-white/10 hover:bg-white/10 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleImport}
            disabled={!file || loading}
            className="flex-1 px-6 py-3 rounded-2xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
            Procesar Importación
          </button>
        </div>

      </div>
    </div>
  )
}
