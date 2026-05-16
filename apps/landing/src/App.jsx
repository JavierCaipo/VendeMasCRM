import { useState, useEffect } from 'react'
import { 
  ShieldCheck, Zap, BarChart3, Users, 
  Rocket, Check, ArrowRight, Layout, Smartphone, Crown, Sparkles
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from './lib/supabase'

const Nav = () => (
  <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 py-4 glass border-b border-white/5 bg-slate-950/50">
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
        <Zap size={20} className="text-white fill-current" />
      </div>
      <span className="text-lg font-black text-white tracking-tighter uppercase">VendeMas</span>
    </div>
    <div className="hidden md:flex items-center gap-8">
      <a href="#features" className="text-xs font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-widest">Funciones</a>
      <a href="#pricing" className="text-xs font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-widest">Precios</a>
      <a href="#testimonials" className="text-xs font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-widest">Testimonios</a>
    </div>
    <div className="flex items-center gap-4">
      <a href="https://app.vendemas.app/login" className="text-xs font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-widest">Entrar</a>
      <a href="#pricing" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl transition-all shadow-lg shadow-indigo-500/25 uppercase tracking-widest">
        Empezar Gratis
      </a>
    </div>
  </nav>
)

const Hero = () => (
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
      
      <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.1] tracking-tight">
        Multiplica tus cierres <br /> 
        <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">sin el caos operativo.</span>
      </h1>
      
      <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">
        El CRM diseñado para equipos industriales y comerciales que necesitan cotizar rápido, 
        gestionar prospectos con IA y tener control total del embudo.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
        <a href="#pricing" className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-black rounded-2xl transition-all shadow-xl shadow-indigo-500/30 flex items-center justify-center gap-2 uppercase tracking-widest">
          Crear cuenta gratuita <ArrowRight size={18} />
        </a>
        <a href="https://demo.vendemas.app" className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 text-white text-sm font-black rounded-2xl border border-white/10 transition-all flex items-center justify-center gap-2 uppercase tracking-widest">
          Ver demo en vivo
        </a>
      </div>

      <div className="pt-20">
        <div className="relative glass rounded-[2.5rem] border border-white/10 p-2 shadow-2xl">
           <img 
             src="https://images.unsplash.com/photo-1551288049-bbbda536639a?auto=format&fit=crop&q=80&w=2070" 
             alt="Dashboard Preview" 
             className="rounded-[2rem] w-full h-auto opacity-90"
           />
           <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent rounded-[2rem]" />
        </div>
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

const PricingTable = ({ pricing, loading }) => {
  const [isAnnual, setIsAnnual] = useState(false)
  const precioUsd = pricing?.precio_mensual_usd || 29
  const tipoCambio = pricing?.tipo_cambio_pen || 3.8
  
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

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Plan Starter */}
          <div className="glass p-10 rounded-[3rem] border border-white/5 flex flex-col">
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

            <button className="w-full py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white text-sm font-black uppercase tracking-widest border border-white/10 transition-all">
              Empezar Ahora
            </button>
          </div>

          {/* Plan PRO */}
          <div className="relative glass p-10 rounded-[3rem] border border-indigo-500/40 bg-indigo-600/5 shadow-2xl shadow-indigo-500/10 flex flex-col scale-105">
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

            <button className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-black uppercase tracking-widest shadow-xl shadow-indigo-500/30 transition-all flex items-center justify-center gap-2">
              Mejorar a PRO <Rocket size={18} />
            </button>
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

  return (
    <div className="bg-[#0B0F19] min-h-screen text-slate-200 selection:bg-indigo-500/30">
      <Nav />
      <main>
        <Hero />
        
        <section id="features" className="py-24 px-6 bg-slate-950/30">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-20 space-y-4">
              <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight uppercase">Herramientas de Alto Impacto.</h2>
              <p className="text-slate-500 max-w-2xl mx-auto font-medium">Todo lo que necesitas para escalar tu operación comercial de 0 a 100.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
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

        <PricingTable pricing={pricing} loading={loading} />
        
        {/* CTA FINAL */}
        <section className="py-24 px-6">
          <div className="max-w-4xl mx-auto glass p-12 md:p-20 rounded-[3.5rem] border border-white/10 text-center relative overflow-hidden">
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-600 rounded-full blur-[100px] opacity-20" />
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-purple-600 rounded-full blur-[100px] opacity-20" />
            
            <div className="relative space-y-8">
               <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight">¿Listo para vender más?</h2>
               <p className="text-slate-400 text-lg max-w-xl mx-auto font-medium">Únete a cientos de empresas que ya están optimizando su operación con VendeMas CRM.</p>
               <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button className="px-10 py-5 bg-white text-slate-950 text-sm font-black rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-widest shadow-2xl">
                    Crear mi cuenta gratis
                  </button>
                  <button className="px-10 py-5 bg-transparent text-white text-sm font-black rounded-2xl border border-white/20 hover:bg-white/5 transition-all uppercase tracking-widest">
                    Hablar con ventas
                  </button>
               </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-12 px-6 border-t border-white/5">
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
            <a href="#" className="text-[10px] text-slate-500 hover:text-white uppercase font-bold tracking-widest transition-colors">Privacidad</a>
            <a href="#" className="text-[10px] text-slate-500 hover:text-white uppercase font-bold tracking-widest transition-colors">Términos</a>
            <a href="#" className="text-[10px] text-slate-500 hover:text-white uppercase font-bold tracking-widest transition-colors">Soporte</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
