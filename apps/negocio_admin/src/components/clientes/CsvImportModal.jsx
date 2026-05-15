// ============================================
// CERCO 3 — Modal de Importación Masiva CSV
// src/components/clientes/CsvImportModal.jsx
// ============================================
import { useState } from 'react'
import { X, UploadCloud, Loader2, CheckCircle2, AlertCircle, FileSpreadsheet, Download } from 'lucide-react'
import Papa from 'papaparse'
import { supabase } from '../../lib/supabaseClient'
import { useTenant } from '../../context/TenantContext'

export default function CsvImportModal({ isOpen, onClose, onSuccess, onError }) {
  const { tenant } = useTenant()
  
  const [file, setFile] = useState(null)
  const [parsedData, setParsedData] = useState([]) // Pre-visualización
  const [uploading, setUploading] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)

  if (!isOpen) return null

  function resetState() {
    setFile(null)
    setParsedData([])
    setErrorMsg(null)
    setUploading(false)
  }

  function handleClose() {
    resetState()
    onClose()
  }

  const descargarPlantilla = () => {
    const headers = "tipo_documento,numero_documento,nombre_razon_social,email,telefono,direccion\n";
    const blob = new Blob([headers], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "plantilla_clientes_vendemas.csv");
    link.click();
  };

  // ── 1. Procesar archivo CSV (Frontend via Papaparse) ──
  function handleFileChange(e) {
    const selected = e.target.files[0]
    if (!selected) return

    if (!selected.name.endsWith('.csv')) {
      setErrorMsg('Por favor selecciona un archivo .csv válido')
      return
    }

    setFile(selected)
    setErrorMsg(null)

    Papa.parse(selected, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        // Validar cabeceras básicas (exigimos al menos documento y nombre)
        const headers = results.meta.fields || []
        const hasRequired = headers.includes('numero_documento') && headers.includes('nombre_razon_social')
        
        if (!hasRequired) {
          setErrorMsg('El CSV debe incluir al menos las cabeceras: numero_documento y nombre_razon_social')
          setParsedData([])
          return
        }
        
        setParsedData(results.data)
      },
      error: (err) => {
        setErrorMsg(`Error al procesar CSV: ${err.message}`)
      }
    })
  }

  // ── 2. Importar a Supabase (Batch Insert) ──
  async function handleImport() {
    if (parsedData.length === 0) return
    setUploading(true)
    setErrorMsg(null)

    // Preparamos el array inyectando negocio_id a todos
    const payload = parsedData.map(row => ({
      negocio_id: tenant.id,
      tipo_documento: row.tipo_documento || 'DNI', // Fallback a DNI
      numero_documento: row.numero_documento,
      nombre_razon_social: row.nombre_razon_social,
      email: row.email || null,
      telefono: row.telefono || null,
      direccion: row.direccion || null,
      // agente_asignado_id se omite en batch para que quede nulo o según def de BD
    }))

    try {
      const { error } = await supabase
        .from('clientes')
        .insert(payload)

      if (error) {
        throw error
      }

      onSuccess?.(`Se importaron ${payload.length} clientes exitosamente.`)
      handleClose()
    } catch (err) {
      setErrorMsg(`Falló la importación: ${err.message}. Revisa que no haya documentos duplicados.`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* SIBLING 1: Backdrop (no cierra si está subiendo) */}
      <div className="absolute inset-0 bg-slate-950 backdrop-blur-3xl" onClick={uploading ? undefined : handleClose} />
      {/* SIBLING 2: Card */}
      <div className="relative z-10 glass border border-white/15 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden fade-up">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <FileSpreadsheet size={18} className="text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">Importación Masiva</h2>
              <p className="text-xs text-slate-400">Sube tu base de clientes en formato CSV</p>
            </div>
          </div>
          {!uploading && (
            <button onClick={handleClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/10 transition-all">
              <X size={16} />
            </button>
          )}
        </div>

        <div className="px-6 py-6 space-y-5">
          
          {/* Error Banner */}
          {errorMsg && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-xs">
              <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Dropzone / Input */}
          {!parsedData.length && !errorMsg && (
            <div className="border-2 border-dashed border-white/15 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:bg-white/5 hover:border-indigo-500/40 transition-colors relative group">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <UploadCloud size={36} className="text-indigo-400 mb-3 group-hover:-translate-y-1 transition-transform" />
              <p className="text-sm font-medium text-slate-200">Haz clic o arrastra un archivo CSV aquí</p>
              <p className="text-xs text-slate-500 mt-1">
                Columnas requeridas: <span className="font-mono text-slate-400">numero_documento, nombre_razon_social</span>
              </p>
              <button
                type="button"
                onClick={descargarPlantilla}
                className="mt-3 flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
              >
                <Download size={12} />
                Descargar Plantilla CSV
              </button>
            </div>
          )}

          {/* Previsualización */}
          {parsedData.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">Vista previa (Primeros 3 registros)</span>
                <span className="text-indigo-400 font-medium">{parsedData.length} registros detectados</span>
              </div>
              <div className="glass rounded-xl overflow-hidden border border-white/10">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/5 border-b border-white/10">
                    <tr>
                      <th className="px-3 py-2 text-slate-400 font-medium">Doc</th>
                      <th className="px-3 py-2 text-slate-400 font-medium">Nombre</th>
                      <th className="px-3 py-2 text-slate-400 font-medium">Email</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {parsedData.slice(0, 3).map((row, i) => (
                      <tr key={i} className="text-slate-300">
                        <td className="px-3 py-2 whitespace-nowrap">{row.numero_documento}</td>
                        <td className="px-3 py-2 truncate max-w-[150px]">{row.nombre_razon_social}</td>
                        <td className="px-3 py-2 truncate max-w-[150px] text-slate-500">{row.email || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Acciones */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={parsedData.length ? resetState : handleClose}
              disabled={uploading}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300 glass border border-white/10 hover:bg-white/10 transition-all disabled:opacity-50"
            >
              {parsedData.length ? 'Cambiar archivo' : 'Cancelar'}
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={uploading || parsedData.length === 0}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
            >
              {uploading ? (
                <><Loader2 size={15} className="animate-spin" /> Importando…</>
              ) : (
                <><CheckCircle2 size={15} /> Confirmar Subida</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
