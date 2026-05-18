import { useState, useEffect } from 'react'
import { 
  ShieldCheck, Zap, BarChart3, Users, 
  Rocket, Check, ArrowRight, Layout, Smartphone, Crown, Sparkles,
  Menu, X as XIcon
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from './lib/supabase'
import FutureAnimation from './components/hero/FutureAnimation'
import RegistrationModal from './components/RegistrationModal'

const Nav = ({ onGetStarted }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <nav className="fixed top-0 inset-x-0 z-50 px-6 py-4 glass border-b border-white/5 bg-slate-950/50">
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Zap size={20} className="text-white fill-current" />
          </div>
          <span className="text-lg font-black text-white tracking-tighter uppercase">VendeMas</span>
        </div>

        {/* Desktop Menu Links */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-xs font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-widest">Funciones</a>
          <a href="#pricing" className="text-xs font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-widest">Precios</a>
          <a href="#testimonials" className="text-xs font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-widest">Testimonios</a>
        </div>

        {/* Desktop Access Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <a href="https://vendemas-crm.vercel.app/login" className="text-xs font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-widest">Entrar</a>
          <button 
            onClick={onGetStarted}
            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl transition-all shadow-lg shadow-indigo-500/25 uppercase tracking-widest cursor-pointer"
          >
            Empezar Gratis
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="flex md:hidden p-2 rounded-xl text-slate-400 hover:text-white bg-white/5 active:scale-95 transition-all"
          aria-label="Abrir menú"
        >
          {isMobileMenuOpen ? <XIcon size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Drawer Menu Panel */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full inset-x-0 mt-1 mx-4 p-6 glass border border-white/10 rounded-2xl bg-[#0B0F19]/98 shadow-2xl flex flex-col gap-6 md:hidden z-40"
          >
            <div className="flex flex-col gap-4 text-center">
              <a 
                href="#features" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-sm font-bold text-slate-300 hover:text-white transition-colors py-2 uppercase tracking-widest border-b border-white/5"
              >
                Funciones
              </a>
              <a 
                href="#pricing" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-sm font-bold text-slate-300 hover:text-white transition-colors py-2 uppercase tracking-widest border-b border-white/5"
              >
                Precios
              </a>
              <a 
                href="#testimonials" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-sm font-bold text-slate-300 hover:text-white transition-colors py-2 uppercase tracking-widest border-b border-white/5"
              >
                Testimonios
              </a>
            </div>

            <div className="flex flex-col gap-4 pt-2">
              <a 
                href="https://vendemas-crm.vercel.app/login" 
                className="w-full text-center py-3 bg-white/5 hover:bg-white/10 text-white text-xs font-black rounded-xl border border-white/10 transition-all uppercase tracking-widest"
              >
                Entrar
              </a>
              <button 
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onGetStarted();
                }}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl transition-all shadow-lg shadow-indigo-500/25 uppercase tracking-widest cursor-pointer"
              >
                Empezar Gratis
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}

const Hero = ({ onGetStarted }) => (
  <section className="relative pt-32 pb-20 px-6 overflow-hidden">
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-full -z-10 opacity-20 pointer-events-none">
      <div className="absolute top-20 left-0 w-96 h-96 bg-indigo-500 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500 rounded-full blur-[120px]" />
    </div>

    <div className="max-w-5xl mx-auto text-center space-y-8 fade-up">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
        <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">CRM B2B de Próxima Generación</span>
      </div>
      
      <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-[1.1] tracking-tight">
        Multiplica tus cierres <br /> 
        <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">sin el caos operativo.</span>
      </h1>
      
      <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">
        El CRM diseñado para equipos industriales y comerciales que necesitan cotizar rápido, 
        gestionar prospectos con IA y tener control total del embudo.
      </p>

      <div className="flex flex-col items-center md:flex-row justify-center gap-4 pt-4 w-full px-4">
        <button 
          onClick={onGetStarted}
          className="w-full max-w-[280px] sm:max-w-none md:w-auto px-6 py-4 bg-indigo-600 hover:bg-indigo-500 text-white text-base sm:text-lg font-black rounded-2xl transition-all shadow-xl shadow-indigo-500/30 flex items-center justify-center gap-2 uppercase tracking-widest cursor-pointer text-center sm:whitespace-nowrap"
        >
          Crear cuenta gratuita <ArrowRight size={18} />
        </button>
        <button 
          onClick={onGetStarted}
          className="w-full max-w-[280px] sm:max-w-none md:w-auto px-6 py-4 bg-white/5 hover:bg-white/10 text-white text-base sm:text-lg font-black rounded-2xl border border-white/10 transition-all flex items-center justify-center gap-2 uppercase tracking-widest cursor-pointer text-center sm:whitespace-nowrap"
        >
          Ver demo en vivo
        </button>
      </div>

      <div className="pt-20">
        <FutureAnimation />
      </div>
    </div>
  </section>
)

const FeatureCard = ({ icon: Icon, title, desc, color }) => (
  <div className="glass p-8 rounded-[2.5rem] border border-white/5 hover:border-indigo-500/20 transition-all group">
    <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
      <Icon size={28} className="text-white" />
    </div>
    <h3 className="text-lg font-black text-white mb-3 uppercase tracking-tight">{title}</h3>
    <p className="text-slate-500 text-sm font-medium leading-relaxed">{desc}</p>
  </div>
)

const PricingTable = ({ pricing, loading, onGetStarted }) => {
  const [isAnnual, setIsAnnual] = useState(false)
  const precioUsd = pricing?.precio_mensual_usd || 29
  const tipoCambio = pricing?.tipo_cambio_pen || 3.8
  
  const salesMsg = "¡Hola VendeMas! Me interesa implementar su CRM next-gen 2035 para mi equipo comercial. ¿Me pueden dar detalles?"
  const salesWaUrl = `https://wa.me/18156566056?text=${encodeURIComponent(salesMsg)}`

  return (
    <section id="pricing" className="py-24 px-6 relative">
      <div className="max-w-6xl mx-auto">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">Precios transparentes.</h2>
          <p className="text-slate-500 font-medium">Elige el plan que mejor se adapte al tamaño de tu equipo.</p>
          
          <div className="flex items-center justify-center gap-4 pt-4">
            <span className={`text-xs font-bold uppercase tracking-widest ${!isAnnual ? 'text-white' : 'text-slate-500'}`}>Mensual</span>
            <button 
              onClick={() => setIsAnnual(!isAnnual)}
              className="w-12 h-6 bg-indigo-600 rounded-full relative p-1 transition-all"
            >
              <div className={`w-4 h-4 bg-white rounded-full transition-all ${isAnnual ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
            <span className={`text-xs font-bold uppercase tracking-widest ${isAnnual ? 'text-white' : 'text-slate-500'}`}>Anual (2 meses gratis)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Plan Starter */}
          <div className="glass p-10 rounded-[3rem] border border-white/5 flex flex-col hover:border-indigo-500/10 transition-all duration-300">
            <div className="space-y-2 mb-8">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Para Emprendedores</span>
              <h3 className="text-2xl font-black text-white uppercase">Starter</h3>
            </div>
            
            <div className="mb-8">
              <span className="text-5xl font-black text-white tracking-tighter">US$ 0</span>
              <span className="text-slate-500 font-bold ml-2">/ siempre gratis</span>
            </div>

            <ul className="space-y-4 mb-10 flex-1">
              {[
                { text: 'Hasta 9 usuarios', icon: Check },
                { text: '100 MB almacenamiento', icon: Check },
                { text: 'Cotizador Express', icon: Check },
                { text: 'CRM Pipeline Estándar', icon: Check },
                { text: 'Timeline de Clientes', icon: Check },
                { text: 'Dashboard Gerencial', icon: X, inactive: true },
                { text: 'Marca Blanca', icon: X, inactive: true },
                { text: 'Importación CSV', icon: X, inactive: true },
              ].map((f, i) => (
                <li key={i} className={`flex items-center gap-3 text-sm font-medium ${f.inactive ? 'text-slate-700' : 'text-slate-400'}`}>
                  <f.icon size={16} className={f.inactive ? 'text-slate-800' : 'text-indigo-500'} />
                  {f.text}
                </li>
              ))}
            </ul>

            <button 
              onClick={onGetStarted}
              className="w-full py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white text-sm font-black uppercase tracking-widest border border-white/10 transition-all cursor-pointer"
            >
              Empezar Ahora
            </button>
          </div>

          {/* Plan PRO */}
          <div className="relative glass p-10 rounded-[3rem] border border-indigo-500/40 bg-indigo-600/5 shadow-2xl shadow-indigo-500/10 flex flex-col scale-100 md:scale-105 hover:border-indigo-500/60 transition-all duration-300">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-indigo-600 text-white text-[10px] font-black rounded-full uppercase tracking-widest shadow-xl">
              Más Popular
            </div>
            
            <div className="space-y-2 mb-8">
              <div className="flex items-center gap-2">
                <Crown size={16} className="text-amber-400" />
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Para Empresas</span>
              </div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tight">VendeMas PRO</h3>
            </div>
            
            <div className="mb-8">
              <div className="flex flex-col">
                <span className="text-5xl font-black text-white tracking-tighter">
                  {loading ? '---' : `US$ ${isAnnual ? Math.round(precioUsd * 0.8) : precioUsd}`}
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-slate-500 font-bold">/ mes</span>
                  {!loading && (
                    <span className="text-[10px] font-bold text-slate-600 uppercase">
                      (Aprox. S/ {(precioUsd * tipoCambio * (isAnnual ? 0.8 : 1)).toFixed(2)})
                    </span>
                  )}
                </div>
              </div>
            </div>

            <ul className="space-y-4 mb-10 flex-1">
              {[
                { text: 'Usuarios Ilimitados', icon: Sparkles },
                { text: '10 GB almacenamiento', icon: Sparkles },
                { text: 'Dashboard Gerencial Full', icon: Sparkles },
                { text: 'Marca Blanca en PDFs', icon: Sparkles },
                { text: 'Importación Masiva (CSV)', icon: Sparkles },
                { text: 'WhatsApp Anti-Spam', icon: Sparkles },
                { text: 'IA Sentiment Analysis', icon: Sparkles },
                { text: 'Soporte Prioritario', icon: Sparkles },
              ].map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-200">
                  <f.icon size={16} className="text-indigo-400" />
                  {f.text}
                </li>
              ))}
            </ul>

            <div className="space-y-3">
              <button 
                onClick={onGetStarted}
                className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-black uppercase tracking-widest shadow-xl shadow-indigo-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                Probar Gratis PRO <Rocket size={18} />
              </button>
              <a 
                href={salesWaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 rounded-2xl bg-transparent border border-indigo-500/30 hover:border-indigo-500/60 hover:bg-indigo-500/5 text-indigo-400 text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                Hablar con ventas
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

const X = ({ className, size }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
  </svg>
)

export default function App() {
  const [pricing, setPricing] = useState({ precio_mensual_usd: 29, tipo_cambio_pen: 3.8 })
  const [loading, setLoading] = useState(true)
  const [isRegOpen, setIsRegOpen] = useState(false)
  const [infoModal, setInfoModal] = useState({ isOpen: false, title: '', content: '' })

  const salesMsg = "¡Hola VendeMas! Me interesa implementar su CRM next-gen 2035 para mi equipo comercial. ¿Me pueden dar detalles?"
  const salesWaUrl = `https://wa.me/18156566056?text=${encodeURIComponent(salesMsg)}`
  const supportMsg = "¡Hola Soporte VendeMas! Necesito ayuda con mi cuenta comercial."
  const supportWaUrl = `https://wa.me/18156566056?text=${encodeURIComponent(supportMsg)}`

  useEffect(() => {
    async function fetchPricing() {
      try {
        const { data, error } = await supabase
          .from('saas_config')
          .select('precio_mensual_usd, tipo_cambio_pen')
          .eq('id', 1)
          .single()
        
        if (data) {
          setPricing(data)
        }
      } catch (err) {
        console.error('Error fetching pricing:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchPricing()
  }, [])

  const openPrivacy = () => {
    setInfoModal({
      isOpen: true,
      title: "Políticas de Privacidad y Confidencialidad B2B",
      content: (
        <div className="space-y-4">
          <p className="font-bold text-white">Última actualización: Mayo 2026</p>
          <p>En VendeMas Business, valoramos y protegemos la privacidad de su organización comercial. Esta política de privacidad detalla la forma en que recopilamos, encriptamos y administramos la información transaccional y de sus clientes.</p>
          <h4 className="font-bold text-white uppercase text-xs">1. Protección de Datos y RLS</h4>
          <p>Toda la información registrada por sus usuarios en la base de datos de VendeMas está protegida mediante políticas estrictas de Seguridad a Nivel de Fila (RLS) de PostgreSQL. Ningún tercero, incluidos otros inquilinos (tenants), podrá acceder a sus cotizaciones, prospectos o pipeline comercial.</p>
          <h4 className="font-bold text-white uppercase text-xs">2. Integración con Supabase y Mercado Pago</h4>
          <p>Al utilizar nuestra infraestructura, sus credenciales y sesiones de autenticación se gestionan bajo estándares bancarios. Los datos de facturación se procesan de forma externa y segura a través de pasarelas de pago de confianza como Mercado Pago.</p>
          <h4 className="font-bold text-white uppercase text-xs">3. Derechos sobre los datos</h4>
          <p>Su negocio retiene la propiedad absoluta de toda la información cargada. Puede exportar de forma completa sus clientes e historial de cotizaciones en cualquier momento sin restricciones operativas.</p>
        </div>
      )
    })
  }

  const openTerms = () => {
    setInfoModal({
      isOpen: true,
      title: "Términos del Servicio y SLA Corporativo",
      content: (
        <div className="space-y-4">
          <p className="font-bold text-white">Última actualización: Mayo 2026</p>
          <p>Al registrarse y activar un portal Starter o PRO en VendeMas Business, su organización acepta plenamente las siguientes condiciones de servicio y garantías de operatividad comercial.</p>
          <h4 className="font-bold text-white uppercase text-xs">1. Uso del Software y Licenciamiento</h4>
          <p>VendeMas concede a su empresa una licencia de uso de software como servicio (SaaS) no exclusiva y limitada a los límites de almacenamiento y usuarios estipulados según el plan contratado (Starter o PRO).</p>
          <h4 className="font-bold text-white uppercase text-xs">2. Garantía de Disponibilidad (SLA)</h4>
          <p>Nos comprometemos a brindar una disponibilidad de plataforma del 99.9% anual para garantizar que su equipo de ventas pueda cotizar en tiempo real en la nube sin interrupciones críticas en el campo.</p>
          <h4 className="font-bold text-white uppercase text-xs">3. Límite de Responsabilidad</h4>
          <p>VendeMas actúa como facilitador tecnológico. No nos hacemos responsables por cierres comerciales no consolidados o interpretaciones de sentimientos erróneas por el motor de inteligencia artificial.</p>
        </div>
      )
    })
  }

  return (
    <div className="bg-[#0B0F19] min-h-screen text-slate-200 selection:bg-indigo-500/30">
      <Nav onGetStarted={() => setIsRegOpen(true)} />
      <main>
        <Hero onGetStarted={() => setIsRegOpen(true)} />
        
        <section id="features" className="py-24 px-6 bg-slate-950/30">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-20 space-y-4">
              <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight uppercase">Herramientas de Alto Impacto.</h2>
              <p className="text-slate-500 max-w-2xl mx-auto font-medium">Todo lo que necesitas para escalar tu operación comercial de 0 a 100.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              <FeatureCard 
                icon={BarChart3} 
                title="Dashboard Gerencial" 
                desc="Visualiza el rendimiento de cada vendedor, cuotas mensuales y proyecciones en tiempo real."
                color="bg-indigo-500/20 text-indigo-400"
              />
              <FeatureCard 
                icon={Smartphone} 
                title="Cotizador Móvil" 
                desc="Crea propuestas profesionales desde tu celular en la planta o en el campo en menos de 60 segundos."
                color="bg-purple-500/20 text-purple-400"
              />
              <FeatureCard 
                icon={Sparkles} 
                title="IA Sentiment" 
                desc="Analizamos el tono de las interacciones con tus clientes para detectar alertas de churn o ventas calientes."
                color="bg-amber-500/20 text-amber-400"
              />
              <FeatureCard 
                icon={Users} 
                title="Gestión B2B" 
                desc="Centraliza tus contactos, sedes y historial de comunicación en una sola línea de tiempo elegante."
                color="bg-emerald-500/20 text-emerald-400"
              />
              <FeatureCard 
                icon={Layout} 
                title="Marca Blanca" 
                desc="Tus clientes verán tu logo y tus colores en cada cotización y portal interactivo. Profesionalismo puro."
                color="bg-sky-500/20 text-sky-400"
              />
              <FeatureCard 
                icon={ShieldCheck} 
                title="Infraestructura Cloud" 
                desc="Tus datos están protegidos con encriptación de nivel bancario y respaldos automáticos diarios."
                color="bg-rose-500/20 text-rose-400"
              />
            </div>
          </div>
        </section>

        <PricingTable pricing={pricing} loading={loading} onGetStarted={() => setIsRegOpen(true)} />

        {/* SECCIÓN DE TESTIMONIOS PERSUASIVOS */}
        <section id="testimonials" className="py-24 px-6 bg-slate-950/20 border-t border-b border-white/5">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16 space-y-4">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.25em]">Casos de Éxito Reales</span>
              <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight uppercase">El impacto en nuestros clientes.</h2>
              <p className="text-slate-500 max-w-2xl mx-auto font-medium">Empresas comerciales e industriales B2B nos eligen para liderar su transformación de ventas.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {/* Testimonio 1 */}
              <div className="glass p-8 rounded-[2.5rem] border border-white/5 flex flex-col justify-between hover:border-indigo-500/10 transition-all duration-300">
                <div className="space-y-6">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Crown key={i} size={12} className="text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed font-semibold italic">
                    "VendeMas transformó nuestra forma de cotizar. En la industria metalmecánica, la velocidad es clave. Ahora enviamos propuestas firmadas desde la planta en menos de un minuto y cerramos un 35% más rápido."
                  </p>
                </div>
                <div className="mt-8 flex items-center gap-4 border-t border-white/5 pt-6">
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-wider">Carlos Mendoza</h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Dir. Operaciones · Aceros del Pacífico</p>
                  </div>
                </div>
              </div>

              {/* Testimonio 2 */}
              <div className="glass p-8 rounded-[2.5rem] border border-white/5 flex flex-col justify-between hover:border-indigo-500/10 transition-all duration-300">
                <div className="space-y-6">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Crown key={i} size={12} className="text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed font-semibold italic">
                    "El análisis de sentimiento con IA nos salvó de perder 3 contratos clave el último trimestre al alertarnos sobre la frustración de los clientes. El pipeline B2B es intuitivo y extremadamente potente."
                  </p>
                </div>
                <div className="mt-8 flex items-center gap-4 border-t border-white/5 pt-6">
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-wider">Sofía Valenzuela</h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Gerente Comercial · Logística Global S.A.</p>
                  </div>
                </div>
              </div>

              {/* Testimonio 3 */}
              <div className="glass p-8 rounded-[2.5rem] border border-white/5 flex flex-col justify-between hover:border-indigo-500/10 transition-all duration-300">
                <div className="space-y-6">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Crown key={i} size={12} className="text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed font-semibold italic">
                    "La marca blanca y la facilidad de uso del cotizador express nos dio el nivel de profesionalismo de una multinacional desde el primer día. Totalmente recomendado para empresas medianas en crecimiento."
                  </p>
                </div>
                <div className="mt-8 flex items-center gap-4 border-t border-white/5 pt-6">
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-wider">Mateo Guerrero</h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Fundador · TecnoRedes Industrias</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA FINAL */}
        <section className="py-24 px-6">
          <div className="max-w-4xl mx-auto glass p-12 md:p-20 rounded-[3.5rem] border border-white/10 text-center relative overflow-hidden">
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-600 rounded-full blur-[100px] opacity-20" />
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-purple-600 rounded-full blur-[100px] opacity-20" />
            
            <div className="relative space-y-8">
               <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight">¿Listo para vender más?</h2>
               <p className="text-slate-400 text-lg max-w-xl mx-auto font-medium">Únete a cientos de empresas que ya están optimizando su operación con VendeMas CRM.</p>
               <div className="pt-4 flex flex-col items-center md:flex-row justify-center gap-4 w-full px-4">
                  <button 
                    onClick={() => setIsRegOpen(true)}
                    className="w-full max-w-[280px] sm:max-w-none md:w-auto px-6 py-4 bg-white text-slate-950 text-base sm:text-lg font-black rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-widest shadow-2xl cursor-pointer text-center justify-center flex items-center sm:whitespace-nowrap"
                  >
                    Crear mi cuenta gratis
                  </button>
                  <a 
                    href={salesWaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full max-w-[280px] sm:max-w-none md:w-auto px-6 py-4 bg-transparent text-white text-base sm:text-lg font-black rounded-2xl border border-white/20 hover:bg-white/5 transition-all uppercase tracking-widest flex items-center justify-center cursor-pointer text-center sm:whitespace-nowrap"
                  >
                    Hablar con ventas
                  </a>
               </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-12 px-6 border-t border-white/5 bg-slate-950/20">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center">
              <Zap size={14} className="text-white fill-current" />
            </div>
            <span className="text-sm font-black text-white tracking-tighter uppercase">VendeMas</span>
          </div>
          
          <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
            © 2026 VendeMas Business. Todos los derechos reservados.
          </p>
          
          <div className="flex gap-6">
            <button onClick={openPrivacy} className="text-[10px] text-slate-500 hover:text-white uppercase font-bold tracking-widest transition-colors cursor-pointer bg-transparent border-none">Privacidad</button>
            <button onClick={openTerms} className="text-[10px] text-slate-500 hover:text-white uppercase font-bold tracking-widest transition-colors cursor-pointer bg-transparent border-none">Términos</button>
            <a href={supportWaUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-slate-500 hover:text-white uppercase font-bold tracking-widest transition-colors">Soporte</a>
          </div>
        </div>
      </footer>

      {/* MODAL DE REGISTRO PLG */}
      <RegistrationModal isOpen={isRegOpen} onClose={() => setIsRegOpen(false)} />

      {/* MODAL DE INFORMACIÓN DETALLADA (LEGAL/TÉRMINOS) */}
      <AnimatePresence>
        {infoModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl overflow-hidden rounded-[2.5rem] border border-white/10 glass bg-slate-950 p-8 shadow-2xl"
            >
              {/* Cerrar */}
              <button
                onClick={() => setInfoModal({ isOpen: false, title: '', content: '' })}
                className="absolute top-6 right-6 p-2 rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={16} />
              </button>
              <div className="space-y-6">
                <h3 className="text-xl font-black text-white uppercase tracking-tight">{infoModal.title}</h3>
                <div className="text-slate-400 text-sm font-medium leading-relaxed max-h-[350px] overflow-y-auto pr-2 space-y-4">
                  {infoModal.content}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
