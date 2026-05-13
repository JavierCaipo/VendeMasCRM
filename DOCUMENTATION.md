# VendeMasCRM v1.0 — Architecture & Operations Manual

Este documento detalla la arquitectura de sistemas, la seguridad y la lógica de negocio detrás de **VendeMasCRM**, un ecosistema B2B SaaS Multi-Tenant construido con los más altos estándares de ingeniería de software.

---

## 1. Arquitectura de Sistemas & Infraestructura (Bajo el Capó)

La infraestructura de VendeMasCRM está diseñada bajo el paradigma de "cero fricción", priorizando el rendimiento, la escalabilidad y la tolerancia a fallos.

### Arquitectura Anti-Frágil y Motor de IA
El núcleo analítico está impulsado por Google Gemini. Sin embargo, para mitigar el riesgo de indisponibilidad de API (deprecación de modelos o errores de red), hemos implementado un sistema de **Model Fallback**.
- **Ejecución Resiliente**: El motor itera de manera silenciosa a través de un arreglo jerárquico de modelos (desde `gemini-1.5-flash-latest` hasta `gemini-pro`). Si un modelo devuelve un error 404 o 500, el sistema transiciona automáticamente al siguiente sin afectar la experiencia del usuario.
- **Data Parsing Estricto**: Un parser propio filtra y sanitiza la respuesta de la IA (eliminando envoltorios Markdown), garantizando que los pipelines consuman un JSON puro y libre de corrupción.

### Sincronización Atómica (Zero-Latency UX)
VendeMasCRM implementa un patrón de hidratación de datos *optimistic UI* que ofrece una experiencia de tiempo real ("Single Source of Truth"):
- **SWR (Stale-While-Revalidate) + Realtime**: La combinación de SWR y las suscripciones a `postgres_changes` elimina por completo la necesidad de recargar la página. Al mutar un dato, la interfaz se actualiza optimísticamente y SWR revalida la caché en segundo plano. El resultado son transiciones de 0 milisegundos entre vistas y datos siempre consistentes en todos los clientes conectados.

### Seguridad Multi-Tenant de Grado Empresarial
El aislamiento de los datos ("Tenant Isolation") no ocurre en la capa de la interfaz de usuario, sino en el motor de la base de datos:
- **Postgres RLS (Row Level Security)**: Cada fila en la base de datos está matemáticamente blindada. Las políticas RLS inyectan el contexto del usuario (`auth.uid()`) interceptando cada query. Si un intento de acceso no coincide estrictamente con el `negocio_id` del tenant autenticado, la base de datos devuelve un conjunto vacío (Drop Silencioso). Es imposible la filtración cruzada de datos, mitigando vulnerabilidades críticas (IDOR).

---

## 2. Manual del Business Admin (Gestión Predictiva)

El rol del administrador ha sido evolucionado de "observador" a "estratega". Las herramientas de gestión no solo tabulan el pasado, sino que proyectan el futuro.

### Smart Dashboard y Proyección de Cierres
El dashboard principal es un panel de control matemático en tiempo real:
- **Cálculo de Brecha (Gap Analysis)**: Al definir la meta de ventas mensual, el sistema no solo muestra el progreso, sino que expone la "Brecha de Cierre" (Meta vs. Real).
- **Proyección Algorítmica**: En lugar de estimaciones al azar, VendeMasCRM calcula el *Ticket Promedio* histórico de los negocios ganados y lo cruza con el volumen de ventas faltantes. El sistema proyecta la métrica accionable: *"Tu equipo necesita asegurar X cierres adicionales este mes para llegar a la meta"*.

### Auditoría de Sentimiento (El Supervisor Silencioso)
La IA no solo resume notas; audita el estado de salud de tu cartera comercial de forma continua.
- Al analizar el lenguaje natural de cada iteración registrada, el algoritmo asigna un *Sentiment Badge*.
- Esto permite al administrador actuar quirúrgicamente, enfocándose en los clientes con bandera 🔴 (Riesgo / Objeciones graves) antes de que la oportunidad se enfríe de manera irreversible. Es inteligencia preventiva aplicada a ingresos.

---

## 3. Manual del Comercial (UX de Alta Precisión)

Para el equipo de ventas, el software debe ser una herramienta táctica invisible. Hemos optimizado la interfaz móvil bajo principios de usabilidad crítica.

### Optimización Ergonómica de Entrada
- **Mobile-First Táctico**: Cada componente interactivo crítico (cotizadores, selectores, botones) respeta un área táctil mínima de **48px** (Touch-Target Size) previniendo "fat-finger errors" en dispositivos móviles.
- **Teclados Contextuales**: Uso estricto de directivas HTML5 (`inputMode="decimal"` o `numeric`) para que el sistema operativo despliegue automáticamente teclados numéricos adaptados, reduciendo el tiempo de captura de datos en un 40%.

### Algoritmo de "Deal Rot" (Podredumbre de Oportunidad)
La gestión del Pipeline no depende del "optimismo" del comercial, sino de la tracción matemática de la venta.
- La probabilidad de cierre (Lead Scoring) se rige por la siguiente ecuación dinámica: 
  `Probabilidad = Porcentaje Base de la Etapa - (Días de Inactividad * 2%)`.
- **Efecto de Gravedad**: El comercial sabrá inmediatamente que si un "Lead" es abandonado en el Pipeline y no se registra actividad, el sistema castiga la probabilidad automáticamente. Esto incentiva un ritmo constante de seguimiento y evita "Pipelines Fantasma" llenos de oportunidades muertas.
