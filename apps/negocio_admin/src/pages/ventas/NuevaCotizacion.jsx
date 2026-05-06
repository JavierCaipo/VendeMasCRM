// ============================================
// CERCO 2 — Motor de Cotizaciones
// src/pages/ventas/NuevaCotizacion.jsx
// ============================================
import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { 
  FilePlus2, User, Package, Trash2, Plus, 
  Save, X, Calculator, Info, Search, 
  ChevronDown, AlertCircle, CheckCircle2, Loader2
} from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useTenant } from '../../context/TenantContext'

export default function NuevaCotizacion() {
  const { tenant } = useTenant()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  const oportunidadIdUrl = searchParams.get('oportunidad_id')
  const clienteIdUrl = searchParams.get('cliente_id')
  
  const [loading, setLoading] = useState(false)
  const [clientes, setClientes] = useState([])
  const [productos, setProductos] = useState([])
  const [userRole, setUserRole] = useState('comercial')

  const formatNumber = (num) => {
    return (parseFloat(num) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }
  
  // Header State
  const [selectedCliente, setSelectedCliente] = useState(null)
  const [contactos, setContactos] = useState([])
  const [selectedContacto, setSelectedContacto] = useState(null)
  const [searchCliente, setSearchCliente] = useState('')
  const [clienteDropdownOpen, setClienteDropdownOpen] = useState(false)
  const [moneda, setMoneda] = useState('PEN')
  const [tipoCambioReferencial, setTipoCambioReferencial] = useState(tenant?.tipo_cambio_usd_pen || 3.80)
  
  useEffect(() => {
    if (tenant?.tipo_cambio_usd_pen) {
      setTipoCambioReferencial(tenant.tipo_cambio_usd_pen)
    }
  }, [tenant?.tipo_cambio_usd_pen])
  
  // Items State
  const [items, setItems] = useState([
    { id: Date.now(), producto_id: '', nombre: '', precio_unitario: 0, cantidad: 1, descuento: 0, total: 0, tarifa_ref: 0 }
  ])

  // Toast State
  const [toast, setToast] = useState(null)

  const showToast = (type, msg) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => {
    fetchInitialData()
  }, [])

  async function fetchInitialData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: dbUser } = await supabase.from('usuarios_negocio').select('rol').eq('id', user.id).single()
      setUserRole(dbUser?.rol || 'comercial')
    }

    const [clis, prods] = await Promise.all([
      supabase.from('clientes').select('*').eq('negocio_id', tenant.id).order('nombre_razon_social'),
      supabase.from('productos').select('*, categorias(nombre), inventario(stock_actual, almacen_id, almacen:almacenes(nombre))').eq('negocio_id', tenant.id).order('nombre')
    ])
    const loadedClientes = clis.data || []
    setClientes(loadedClientes)
    setProductos(prods.data || [])

    if (clienteIdUrl) {
      const preselected = loadedClientes.find(c => c.id === clienteIdUrl)
      if (preselected) {
        setSelectedCliente(preselected)
      }
    }
  }

  useEffect(() => {
    if (selectedCliente) {
      fetchContactos(selectedCliente.id)
    } else {
      setContactos([])
      setSelectedContacto(null)
    }
  }, [selectedCliente])

  async function fetchContactos(clienteId) {
    const { data } = await supabase
      .from('cliente_contactos')
      .select('*')
      .eq('cliente_id', clienteId)
      .order('nombre_completo')
    setContactos(data || [])
    setSelectedContacto(null)
  }

  const filteredClientes = useMemo(() => {
    if (!searchCliente) return clientes
    return clientes.filter(c => 
      c.nombre_razon_social.toLowerCase().includes(searchCliente.toLowerCase()) || 
      c.numero_documento.includes(searchCliente)
    )
  }, [clientes, searchCliente])

  const handleAddLine = () => {
    setItems([...items, { id: Date.now(), producto_id: '', nombre: '', precio_unitario: 0, cantidad: 1, descuento: 0, total: 0, tarifa_ref: 0 }])
  }

  const handleRemoveLine = (id) => {
    if (items.length === 1) return
    setItems(items.filter(item => item.id !== id))
  }

  const handleItemChange = (id, field, value) => {
    const newItems = items.map(item => {
      if (item.id !== id) return item
      
      let updatedItem = { ...item, [field]: value }

      // Si cambia el producto, aplicar lógica de tarifas
      if (field === 'producto_id') {
        const prod = productos.find(p => p.id === value)
        if (prod && selectedCliente) {
          const tier = selectedCliente.tarifa_asignada || 'C'
          const basePrice = prod[`precio_${tier.toLowerCase()}`] || 0
          
          let precio_sugerido = basePrice
          const tc = parseFloat(tipoCambioReferencial) || 1
          
          if (moneda !== prod.moneda) {
            if (moneda === 'PEN' && prod.moneda === 'USD') {
              precio_sugerido = basePrice * tc
            } else if (moneda === 'USD' && prod.moneda === 'PEN') {
              precio_sugerido = basePrice / tc
            }
          }
          
          const stockTotal = prod.inventario?.reduce((acc, inv) => acc + Number(inv.stock_actual), 0) || 0
          const stockBreakdown = prod.inventario?.map(inv => `${inv.almacen?.nombre || 'Almacén'}: ${inv.stock_actual}`).join('\n') || 'Sin stock registrado'
          
          updatedItem.nombre = prod.nombre
          updatedItem.precio_unitario = parseFloat(precio_sugerido.toFixed(2))
          updatedItem.tarifa_ref = parseFloat(precio_sugerido.toFixed(2))
          updatedItem.stockTotal = stockTotal
          updatedItem.stockBreakdown = stockBreakdown
        }
      }

      // Recalcular Total de Línea con Descuento Porcentual
      const sub = updatedItem.cantidad * updatedItem.precio_unitario
      const dcto_pct = parseFloat(updatedItem.descuento) || 0
      updatedItem.total = sub * (1 - (dcto_pct / 100))
      
      return updatedItem
    })
    setItems(newItems)
  }

  // Recálculo Reactivo al Cambiar Moneda o Tipo de Cambio
  useEffect(() => {
    if (!selectedCliente || productos.length === 0) return;
    
    setItems(prevItems => prevItems.map(item => {
      if (!item.producto_id) return item;
      const prod = productos.find(p => p.id === item.producto_id);
      if (!prod) return item;
      
      const tier = selectedCliente.tarifa_asignada || 'C';
      const basePrice = prod[`precio_${tier.toLowerCase()}`] || 0;
      
      let precio_sugerido = basePrice;
      const tc = parseFloat(tipoCambioReferencial) || 1;
      
      if (moneda !== prod.moneda) {
        if (moneda === 'PEN' && prod.moneda === 'USD') {
          precio_sugerido = basePrice * tc;
        } else if (moneda === 'USD' && prod.moneda === 'PEN') {
          precio_sugerido = basePrice / tc;
        }
      }
      
      const newPrecio = parseFloat(precio_sugerido.toFixed(2));
      const sub = item.cantidad * newPrecio;
      const dcto_pct = parseFloat(item.descuento) || 0;
      const newTotal = sub * (1 - (dcto_pct / 100));
      
      const stockTotal = prod.inventario?.reduce((acc, inv) => acc + Number(inv.stock_actual), 0) || 0;
      const stockBreakdown = prod.inventario?.map(inv => `${inv.almacen?.nombre || 'Almacén'}: ${inv.stock_actual}`).join('\n') || 'Sin stock registrado';
      
      return { 
        ...item, 
        precio_unitario: newPrecio, 
        tarifa_ref: newPrecio, 
        total: newTotal,
        stockTotal,
        stockBreakdown
      };
    }));
  }, [moneda, tipoCambioReferencial]);

  const totals = useMemo(() => {
    const sub = items.reduce((acc, curr) => acc + (parseFloat(curr.total) || 0), 0);
    const igvCalculado = sub * 0.18; 
    const totalCalculado = sub + igvCalculado;
    return { subtotal: sub, igv: igvCalculado, total: totalCalculado };
  }, [items])

  async function handleSave() {
    if (!selectedCliente) return showToast('error', 'Selecciona un cliente')
    if (items.some(i => !i.producto_id)) return showToast('error', 'Completa todos los productos')
    
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      // 1. Obtención de Correlativo Atómico
      const { data: seqNum, error: rpcError } = await supabase
        .rpc('get_next_cotizacion_seq', { p_negocio_id: tenant.id });

      if (rpcError) throw rpcError;

      // 2. Formato Premium del Correlativo (Con extracción de nombre real)
      let nombreVendedor = user?.email || 'Vendedor';
      
      // Consultamos a la fuente de la verdad para obtener el nombre real ("Santiago Caipo")
      if (user?.id) {
        const { data: dbUser } = await supabase
          .from('usuarios_negocio')
          .select('nombre_completo')
          .eq('id', user.id)
          .single();
          
        if (dbUser?.nombre_completo) {
          nombreVendedor = dbUser.nombre_completo;
        }
      }

      // Extraemos iniciales de la empresa y del vendedor
      const empresaCode = (tenant?.nombre_comercial || tenant?.nombre || 'EMP').substring(0, 4).toUpperCase().replace(/[^A-Z]/g, '') || 'EMP';
      const nameParts = nombreVendedor.split(' ').filter(Boolean);
      
      let iniciales = 'XX';
      if (nameParts.length >= 2) {
        iniciales = (nameParts[0][0] + nameParts[1][0]).toUpperCase(); // "Santiago Caipo" -> "SC"
      } else if (nameParts.length === 1) {
        iniciales = nameParts[0].substring(0, 2).toUpperCase(); // "Santiago" -> "SA"
      }
      
      const correlativoSeguro = `${empresaCode}-${iniciales}-${String(seqNum).padStart(5, '0')}`;

      const quotePayload = {
        negocio_id: tenant.id,
        cliente_id: selectedCliente.id,
        contacto_id: selectedContacto ? selectedContacto.id : null,
        oportunidad_id: oportunidadIdUrl || null,
        correlativo: correlativoSeguro,
        moneda: moneda,
        tipo_cambio: parseFloat(tipoCambioReferencial) || null,
        total: Number(totals.total),
        estado: 'borrador'
      }

      // 3. Sanitización UUID (evitar error de empty string)
      if (!quotePayload.contacto_id || quotePayload.contacto_id === '') delete quotePayload.contacto_id;
      if (!quotePayload.oportunidad_id || quotePayload.oportunidad_id === '') delete quotePayload.oportunidad_id;

      if (userRole === 'comercial' && user) {
        quotePayload.agente_id = user.id
      } else {
        quotePayload.agente_id = user.id // Default para admin si no se añade un selector de agentes a futuro
      }

      const { data: quote, error: qErr } = await supabase
        .from('cotizaciones')
        .insert([quotePayload])
        .select()
        .single()

      if (qErr) throw qErr

      // Sync Pipeline: Insertar o actualizar Oportunidad
      if (!quotePayload.oportunidad_id) {
        const opPayload = {
          negocio_id: tenant.id,
          cliente_id: selectedCliente.id,
          agente_id: quotePayload.agente_id,
          titulo: `Cot. ${correlativoSeguro} - ${selectedCliente.nombre_razon_social || selectedCliente.nombre_completo}`,
          valor_estimado: quotePayload.total,
          moneda: quotePayload.moneda
        }
        // Insertamos la oportunidad y opcionalmente podríamos enlazar su ID a la cotización,
        // pero por ahora solo la creamos para que aparezca en el Pipeline.
        const { data: newOp } = await supabase.from('oportunidades').insert([opPayload]).select().single()
        if (newOp) {
           await supabase.from('cotizaciones').update({ oportunidad_id: newOp.id }).eq('id', quote.id)
        }
      } else {
        // Actualizamos la oportunidad existente con el nuevo monto
        await supabase
          .from('oportunidades')
          .update({ valor_estimado: quotePayload.total, moneda: quotePayload.moneda })
          .eq('id', quotePayload.oportunidad_id)
      }

      // 4. Insert Detalles (Sanitización Numérica estricta)
      const detailPayload = items.map(i => ({
        cotizacion_id: quote.id,
        producto_id: i.producto_id,
        cantidad: Number(i.cantidad),
        precio_unitario: Number(i.precio_unitario),
        descuento_porcentaje: Number(i.descuento || 0),
        subtotal: Number(i.total)
      }))

      const { error: dErr } = await supabase
        .from('cotizacion_detalles')
        .insert(detailPayload)

      if (dErr) throw dErr

      showToast('success', 'Cotización generada exitosamente')
      setTimeout(() => navigate('/cotizaciones'), 1500)
    } catch (err) {
      console.error('Error al guardar cotización:', err)
      showToast('error', err.message || JSON.stringify(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
            <FilePlus2 size={24} className="text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Nueva Cotización</h1>
            <p className="text-sm text-slate-400">Motor de ventas con tarifas escaladas inteligentes.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/cotizaciones')}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-300 glass border border-white/10 hover:bg-white/10 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 shadow-lg shadow-indigo-500/20 disabled:opacity-50"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Generar Cotización
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna Izquierda: Cliente y Datos */}
        <div className="lg:col-span-1 space-y-6">
          <div className="relative z-[100] p-6 rounded-3xl bg-slate-800/40 border border-slate-700/50 space-y-4">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
              <User size={14} /> Selección de Cliente
            </div>
            
            <div className="relative">
              <div 
                onClick={() => setClienteDropdownOpen(!clienteDropdownOpen)}
                className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm text-slate-100 flex items-center justify-between cursor-pointer hover:border-white/20 transition-all"
              >
                {selectedCliente ? (
                  <span className="truncate font-medium">{selectedCliente.nombre_razon_social}</span>
                ) : (
                  <span className="text-slate-500">
                    {clientes.length === 0 ? 'No tienes clientes asignados' : 'Buscar cliente...'}
                  </span>
                )}
                <ChevronDown size={16} className={`text-slate-500 transition-transform ${clienteDropdownOpen ? 'rotate-180' : ''}`} />
              </div>

              {clienteDropdownOpen && (
                <div className="absolute z-[999] w-full mt-1 bg-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-slate-700 rounded-xl max-h-80 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2">
                  <div className="p-3 border-b border-slate-700 bg-slate-900/50">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        autoFocus
                        value={searchCliente}
                        onChange={e => setSearchCliente(e.target.value)}
                        placeholder="DNI o Nombre..."
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-all"
                      />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {filteredClientes.map(c => (
                      <div
                        key={c.id}
                        onClick={(e) => { 
                          e.stopPropagation();
                          setSelectedCliente(c); 
                          setSearchCliente(c.nombre_razon_social);
                          setClienteDropdownOpen(false); 
                        }}
                        className="px-4 py-3 hover:bg-slate-700 cursor-pointer transition-colors border-b border-slate-700 last:border-0 group"
                      >
                        <p className="text-sm font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">{c.nombre_razon_social}</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">{c.numero_documento} • Tarifa {c.tarifa_asignada}</p>
                      </div>
                    ))}
                    {filteredClientes.length === 0 && (
                      <div className="p-8 text-center text-slate-500 text-xs italic">
                        {clientes.length === 0 ? 'No tienes clientes asignados (Contacta a un Admin)' : 'No se encontraron clientes.'}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {selectedCliente && (
              <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 space-y-3 animate-in fade-in zoom-in-95">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Tarifa Aplicada</span>
                  <span className="px-2 py-0.5 rounded-lg bg-indigo-500 text-white text-[10px] font-black uppercase">
                    Plan {selectedCliente.tarifa_asignada}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-400 font-medium">{selectedCliente.email || 'Sin correo'}</p>
                  <p className="text-xs text-slate-400 font-medium">{selectedCliente.telefono || 'Sin teléfono'}</p>
                </div>
                
                {/* Selector de Contacto Condicional */}
                <div className="pt-2 mt-2 border-t border-indigo-500/10">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase px-1 mb-1.5">Atención a (Contacto)</label>
                  <select
                    value={selectedContacto?.id || ''}
                    onChange={e => setSelectedContacto(contactos.find(c => c.id === e.target.value) || null)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-100 focus:outline-none focus:border-indigo-500/50"
                  >
                    <option value="" className="bg-slate-900">Sin contacto específico...</option>
                    {contactos.map(c => (
                      <option key={c.id} value={c.id} className="bg-slate-900">
                        {c.nombre_completo} {c.cargo ? `- ${c.cargo}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="relative z-0 p-6 rounded-3xl bg-slate-800/40 border border-slate-700/50 space-y-4">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
              <Calculator size={14} /> Resumen de Venta
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Divisa</span>
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] font-bold text-slate-500 uppercase">T.C. Referencial</span>
                    <input 
                      type="number" 
                      step="0.001"
                      value={tipoCambioReferencial} 
                      onChange={e => setTipoCambioReferencial(e.target.value)}
                      className="w-16 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-slate-300 text-right focus:outline-none focus:border-indigo-500/50"
                    />
                  </div>
                  <div className="flex p-1 bg-slate-900/50 rounded-xl border border-white/5">
                  <button 
                    onClick={() => setMoneda('PEN')}
                    className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all ${moneda === 'PEN' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    PEN
                  </button>
                  <button 
                    onClick={() => setMoneda('USD')}
                    className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all ${moneda === 'USD' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    USD
                  </button>
                </div>
              </div>
            </div>
            <div className="flex justify-between text-sm">
                <span className="text-slate-400">Subtotal</span>
                <span className="text-slate-100 font-medium">{moneda === 'USD' ? '$' : 'S/'} {formatNumber(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">IGV (18%)</span>
                <span className="text-slate-100 font-medium">{moneda === 'USD' ? '$' : 'S/'} {formatNumber(totals.igv)}</span>
              </div>
              <div className="pt-3 border-t border-white/10 flex justify-between items-end">
                <span className="text-slate-200 font-bold">Total Final</span>
                <span className="text-2xl font-black text-indigo-400 leading-none">{moneda === 'USD' ? '$' : 'S/'} {formatNumber(totals.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Detalle de Cotización */}
        <div className="lg:col-span-2">
          <div className="glass rounded-3xl border border-white/10 overflow-hidden flex flex-col h-full min-h-[400px]">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                <Package size={14} /> Detalle de Productos
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
              {items.map((item, idx) => (
                <div key={item.id} className="group relative flex flex-col md:flex-row gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all animate-in slide-in-from-right-4">
                  
                  {/* Selector de Producto */}
                  <div className="flex-1 space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Producto</label>
                    <select
                      value={item.producto_id}
                      onChange={e => handleItemChange(item.id, 'producto_id', e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-100 focus:outline-none focus:border-indigo-500/50"
                    >
                      <option value="" className="bg-slate-900">Seleccionar...</option>
                      {productos.map(p => (
                        <option key={p.id} value={p.id} className="bg-slate-900">
                          {p.nombre} ({p.sku})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Cantidad y Precio */}
                  <div className="flex gap-4">
                    <div className="w-20 space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Cant.</label>
                      <input
                        type="number"
                        min="1"
                        value={item.cantidad}
                        onChange={e => handleItemChange(item.id, 'cantidad', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-100 text-center focus:outline-none focus:border-indigo-500/50"
                      />
                      {item.producto_id && (
                        <div 
                          title={item.stockBreakdown}
                          className={`text-[10px] mt-1 font-medium text-center cursor-help ${item.cantidad > item.stockTotal ? 'text-red-400 animate-pulse' : 'text-slate-400'}`}
                        >
                          Stock: {item.stockTotal || 0} und.
                        </div>
                      )}
                    </div>
                    <div className="w-28 space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Precio Unit.</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[10px]">{moneda === 'USD' ? '$' : 'S/'}</span>
                        <input
                          type="number"
                          step="0.01"
                          value={item.precio_unitario}
                          onChange={e => handleItemChange(item.id, 'precio_unitario', parseFloat(e.target.value) || 0)}
                          className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-100 focus:outline-none focus:border-indigo-500/50 font-bold"
                        />
                      </div>
                      {item.tarifa_ref > 0 && (
                        <span className="block text-[9px] text-slate-500 font-bold uppercase px-1">
                          Ref Tarifa {selectedCliente?.tarifa_asignada}: {moneda === 'USD' ? '$' : 'S/'} {item.tarifa_ref}
                        </span>
                      )}
                    </div>
                    <div className="w-20 space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Dcto (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={item.descuento}
                        onChange={e => handleItemChange(item.id, 'descuento', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-100 text-center focus:outline-none focus:border-indigo-500/50"
                      />
                    </div>
                  </div>

                  {/* Total Línea */}
                  <div className="w-32 space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Subtotal</label>
                    <div className="w-full px-3 py-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 font-black flex items-center justify-center">
                      {moneda === 'USD' ? '$' : 'S/'} {formatNumber(item.total)}
                    </div>
                  </div>

                  {/* Acciones */}
                  <button 
                    onClick={() => handleRemoveLine(item.id)}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}

              {/* Botón Agregar Fila (UX Mejorada) */}
              <button
                onClick={handleAddLine}
                className="w-full py-4 mt-2 rounded-2xl border-2 border-dashed border-white/5 hover:border-indigo-500/30 hover:bg-indigo-500/5 text-slate-500 hover:text-indigo-400 transition-all flex items-center justify-center gap-2 group"
              >
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Plus size={16} />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest">Agregar nuevo producto</span>
              </button>
            </div>

            <div className="p-6 bg-white/5 border-t border-white/10 flex items-center gap-3">
              <Info size={14} className="text-slate-500" />
              <p className="text-[10px] text-slate-500 leading-relaxed italic">
                El precio unitario se ajusta automáticamente según el nivel del cliente (A, B o C), pero puede ser editado manualmente para ajustes comerciales.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm border shadow-2xl glass animate-in slide-in-from-bottom-2 ${
          toast.type === 'success' ? 'border-emerald-500/30 text-emerald-300' : 'border-red-500/30 text-red-300'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}
    </div>
  )
}
