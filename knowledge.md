# 🧠 CONTEXTO CENTRAL: VendeMas SaaS (CRM B2B)
**ESTADO DEL DOCUMENTO:** VIVO. LEER SIEMPRE ANTES DE EJECUTAR CUALQUIER TAREA.
**MISIÓN DE LA IA:** Eres "Antigravity Factory". Tu objetivo es construir módulos robustos, manteniendo la multitenencia, respetando estrictamente la base de datos y sin borrar funcionalidades previas. AL TERMINAR UNA TAREA, debes sugerir qué nuevas reglas o esquemas debemos agregar a este documento.

## 1. Arquitectura y Stack
* **Frontend:** React (Vite), Tailwind CSS.
* **Backend as a Service (BaaS):** Supabase (PostgreSQL, Auth, Storage).
* **UI/UX:** Glassmorphism, dark mode nativo, íconos de `lucide-react`. Interfaz limpia y corporativa B2B.

## 2. Reglas de Oro ("El Cerco")
* **Multitenencia Estricta:** TODO el sistema pertenece a un `negocio`. Se usa `TenantContext` para obtener el `negocio_id` actual. En todo `INSERT` o `UPDATE`, el `negocio_id` debe inyectarse explícitamente en la tabla principal (nunca en tablas pivote que no lo tengan).
* **Nomenclatura Exacta:** Prohibido inventar columnas. Usa SIEMPRE los nombres definidos en el Esquema de BD de este documento. Supabase usa *snake_case*.
* **Aislamiento de Errores (UI):** Prohibido el fallo silencioso. Todo guardado a BD debe usar `try/catch`. El `catch` debe mostrar un Toast explícito: `toast.error("Error BD: " + (error.message || JSON.stringify(error)))`.
* **Manejo de Multimedia:** La subida de archivos (Storage) debe ejecutarse en un `try/catch` INDEPENDIENTE antes de tocar la base de datos.
* **Saneamiento Anti-Error 400:** Todo input numérico debe sanearse con `parseFloat(val) || 0` antes de enviarse a Supabase. Los UUIDs opcionales vacíos (`""`) deben enviarse como `null`.

## 3. Esquema Estricto de Base de Datos
*No asumas otras columnas, usa estrictamente estas.*

**[negocios]**
* `id` (UUID PK), `nombre`, `subdominio`, `plan` ('free', 'pro'), `ruc`, `telefono`, `correo_ventas`, `sitio_web`, `redes_sociales`, `tipo_cambio_usd_pen` (DECIMAL).

**[clientes]**
* `id` (UUID PK), `negocio_id` (FK), `tipo_documento`, `numero_documento`, `nombre_razon_social`, `email`, `telefono`, `direccion`, `tarifa_asignada` ('A', 'B', 'C').

**[productos]**
* `id` (UUID PK), `negocio_id` (FK), `categoria_id` (FK nulo), `sku`, `nombre`, `fabricante`, `descripcion`, `moneda` ('PEN', 'USD'), `precio_a`, `precio_b`, `precio_c`, `fotos` (TEXT[]), `url_ficha_tecnica` (TEXT), `url_certificado_calidad` (TEXT). *(Nota: precio_base e imagenes NO existen).*

**[almacenes]**
* `id` (UUID PK), `negocio_id` (FK), `nombre`, `ubicacion`.

**[inventario]** (Pivote de stock)
* `id` (UUID PK), `producto_id` (FK), `almacen_id` (FK), `stock_actual` (DECIMAL). *(Nota: NO tiene negocio_id ni cantidad).*

**[movimientos_inventario]** (Kardex automatizado)
* `id` (UUID PK), `producto_id` (FK), `almacen_id` (FK), `tipo` ('INGRESO', 'SALIDA'), `cantidad` (DECIMAL), `referencia`, `fecha_creacion`.

**[perfiles]**
* `id` (UUID), `negocio_id` (FK), `rol` (VARCHAR), `nombre_completo` (VARCHAR), `fecha_creacion` (TIMESTAMPTZ).

**[cotizaciones]** (Cabecera)
* `id` (PK), `negocio_id` (FK), `cliente_id` (FK), `contacto_id` (FK nulo), `agente_id` (FK), `oportunidad_id` (FK nulo), `correlativo`, `moneda`, `tipo_cambio` (DECIMAL), `estado`, `subtotal`, `impuestos`, `total`, `validez_dias`, `notas_condiciones`, `fecha_creacion`.

**[cotizacion_detalles]** (Ítems)
* `id` (PK), `cotizacion_id` (FK), `producto_id` (FK), `cantidad`, `precio_unitario`, `descuento_porcentaje`, `subtotal`.

**[cotizacion_detalles]** (Chat)
* `id` (PK), `cotizacion_id` (FK), `autor` ('Cliente' | 'Vendedor'), `mensaje`, `fecha_creacion`.

**[pipeline_etapas]** (Columnas Kanban Data-Driven)
* `id` (UUID PK), `negocio_id` (FK), `nombre` (VARCHAR), `orden` (INTEGER). *(Nota: Permite personalización multiplataforma sin depender de enums estáticos).*

**[oportunidades]** (Leads CRM)
* `id` (UUID PK), `negocio_id` (FK), `etapa_id` (FK), `titulo` (VARCHAR), `valor_estimado` (DECIMAL), `cliente_id` (FK nulo), `fecha_creacion`.

## 4. Lógica de Componentes Clave
* **ProductoForm.jsx:** Utiliza un estado centralizado `formData`. Usa Upsert (`onConflict: 'producto_id, almacen_id'`) exclusivo para el `inventario` SIN inyectar `negocio_id`.
* **CatalogoView.jsx:** Implementa el "Borrado Relacional Absoluto". Primero ejecuta un `storage.from('productos').remove()` para limpiar imágenes y PDFs huérfanos, luego elimina registros en `inventario` (sin `negocio_id`) y finalmente el registro en `productos` aplicando el filtro estricto de multitenencia `.eq('negocio_id', tenant.id)`.
* **PublicQuoteView.jsx:** Portal público (Mobile-First) con Glassmorphism. Permite al cliente aprobar/rechazar propuestas con feedback visual (confetti) y chat en tiempo real usando la tabla `cotizacion_comentarios`.
* **Generación de PDF:** Usa `@react-pdf/renderer` con Deep Selects en Supabase (`cotizaciones(*, cliente:clientes(*), detalles:cotizacion_detalles(*, producto:productos(*)))`).
* **Flujo Quote-to-Deal:** Conexión B2B entre el Módulo CRM (Kanban) y el Motor de Cotizaciones. Usa React Router Parameters (`searchParams`) para trasladar el contexto (`oportunidad_id` y `cliente_id`), permitiendo generar propuestas en 1 clic y mantener trazabilidad bidireccional desde el prospecto hasta el cierre.

## 5. Interacción y Documentación Enriquecida
* **Riqueza Visual en PDFs:** Todo documento exportado (CotizacionPDF) debe incluir miniaturas de productos (30x30px) y enlaces dinámicos a documentación técnica (Fichas/Certificados) para reducir la fricción en la decisión del cliente.
* **Algoritmos de Mensajería:** Las comunicaciones vía WhatsApp deben evitar la repetitividad mediante el uso de arrays de `MENSAJES_ESTRATEGICOS`. Cada envío debe seleccionar una variante aleatoria que resalte un valor distinto (Eficiencia, Seguridad, Alianza, etc.).
* **Placeholders Estándar:** Los mensajes dinámicos deben usar las llaves `{cliente}`, `{correlativo}` y `{url}` para garantizar la consistencia en el reemplazo de variables.
* **Tono Consultivo:** La redacción de la interfaz y mensajes debe posicionar al usuario como un "Aliado Estratégico" y no como un vendedor transaccional.
* **Notificaciones Push B2B:** Se utiliza Supabase Realtime (WebSockets) en `TenantContext.jsx` para escuchar cambios en la tabla `cotizaciones`. Esto permite que el equipo comercial reciba alertas visuales instantáneas (`sonner`) cuando un cliente aprueba una propuesta desde el portal público, garantizando una respuesta inmediata.

## 6. Automatizaciones (Triggers)
* **`trigger_cotizacion_aceptada`:** Cuando una cotización en `[cotizaciones]` cambia su `estado` a `'aceptada'` (ej. desde el portal web de clientes), este trigger de PostgreSQL se dispara automáticamente.
  * **Lógica de Resolución:** El trigger busca dinámicamente la última etapa del embudo en `[pipeline_etapas]` (ordenando por `orden DESC` y filtrando por el `negocio_id` correspondiente).
  * **Efecto:** Actualiza automáticamente el `etapa_id` de la tabla `[oportunidades]` para la oportunidad vinculada a la cotización, moviendo el Lead a la columna de Cierre (Ganado).
  * **Ventaja:** Garantiza la integridad del embudo comercial en tiempo real, incluso si el vendedor tiene el CRM cerrado o el cliente acepta la propuesta fuera del horario laboral.

  ## [Actualización Reciente - Estabilización y UI Premium]
- **Súper Trigger "Quote-to-Deal" (PostgreSQL):** Se unificó la lógica financiera. El trigger `manejar_cambios_cotizacion` ahora actualiza automáticamente el `valor_estimado` de la Oportunidad si la cotización se edita. Si la cotización cambia a estado 'aceptada', mueve automáticamente la tarjeta en el Kanban a la etapa final de cierre.
- **UX Premium en Kanban:** Se ajustaron los sensores de `@dnd-kit/core` (`activationConstraint: { distance: 5 }`) para evitar movimientos accidentales de las tarjetas por clics ligeros.
- **Arquitectura de Modales (Glassmorphism):** Se estandarizó el uso de modales con overlays centrados (`fixed inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm`), fondos oscuros (`#0B0F19`) y botón de cierre `<X />` absoluto para garantizar una UX de alta gama.
- **Dashboard Data-Driven:** Se implementó `DashboardView.jsx` en la ruta `/` como Centro de Mando principal, con tarjetas de KPIs (Total Embudo, Cierres, Activas, Ticket Promedio) listos para conectar a Supabase, abandonando las pantallas vacías.

## [Actualización Reciente - Portal del Cliente White-Label]
- **PublicQuoteView.jsx (Portal Interactivo):** Se rediseñó la vista pública de cotizaciones con una estética "Paper-White" Premium (estilo Notion/Stripe).
- **Marca Blanca (Cliente Final):** El portal inyecta dinámicamente el `logo_url` del Tenant en el encabezado, generando confianza institucional.
- **Motor de Cierre (Sticky Bottom Bar):** Se implementó una barra de acción flotante con el botón "APROBAR PROPUESTA". Al accionarse, actualiza el estado en Supabase (`aceptada`), lo que desencadena el Súper Trigger SQL que mueve la oportunidad en el Kanban.
- **Efecto Wow:** Se integró `canvas-confetti` y un "Success Overlay" que congela la propuesta tras la aprobación, sumado a un módulo de chat en tiempo real para consultas.

## 7. Estrategia de Distribución (WhatsApp Motor)
*   **Arquitectura de Mensajería:** Implementada en `CotizacionesView.jsx` mediante un array de 25+ variantes (`MENSAJES_ESTRATEGICOS`). 
*   **Algoritmo de Rotación:** Selección aleatoria vía `Math.random()` para evitar que el cliente perciba patrones de bot y mejorar la tasa de apertura.
*   **Placeholders Dinámicos:**
    *   `{cliente}`: Nombre o razón social del prospecto.
    *   `{correlativo}`: ID de seguimiento institucional.
    *   `{url}`: Enlace profundo al Portal Público de Cliente (`/c/:id`).
*   **Tono Consultivo:** Los mensajes rotan entre pilares de "Eficiencia", "Seguridad", "Alianza" y "Rentabilidad", posicionando al vendedor como un consultor estratégico.

## 8. Estatus Funcional (Ready-to-Market)
*   **Core 100%:** CRM Pipeline, Motor de Cotizaciones, Inventario Multialmacén, Automatización Quote-to-Deal.
*   **Premium Built:** Marca Blanca, PDF Luxury, Portal Público Interactivo, WhatsApp Motor.

## 9. Modelo de Monetización (Freemium & Paywall)
*   **El Guardián (useFreemium):** Hook centralizado que valida límites en tiempo real.
*   **Límites Plan Free:**
    *   **Usuarios:** Máximo 10 por equipo.
    *   **Archivos:** Límite estricto de 2MB por archivo (PDFs/Imágenes).
    *   **Marca Blanca:** Deshabilitada. Se muestra branding de "VendeMas" en portales y PDFs.
*   **Paywall Interactivo (PaywallModal):** Interfaz de alto impacto que intercepta acciones Pro (subida de logo, archivos pesados) y redirige al flujo de upgrade ($29/mes).
*   **Integración de Pagos (Edge Functions):**
    *   **mp-checkout:** Función en Deno que utiliza la API de Suscripciones (`/preapproval`) de Mercado Pago para generar ingresos recurrentes automáticos.
    *   **mp-webhook (Arquitectura de Activación):**
        *   **Seguridad:** Utiliza `SUPABASE_SERVICE_ROLE_KEY` para bypass de RLS.
        *   **Validación:** Consulta directamente a la API de Mercado Pago (`/preapproval/{id}`) para verificar el estado `authorized` o `active`.
        *   **Efecto:** Actualiza el campo `plan` a `'pro'` en la tabla `negocios` usando el `external_reference` (ID del negocio).
    *   **Flujo:** Paywall -> Invoke `mp-checkout` -> Redirect to `init_point` -> MP Webhook -> Plan Upgrade.

    ## Módulo de Recursos Humanos y Seguridad (RBAC)
- **Estructura de Base de Datos:** Se implementó la tabla pública `usuarios_negocio` como puente seguro hacia `auth.users`.
- **Roles y Accesos:** 
  - Restricción estricta de roles (`admin`, `comercial`) y estados (`activo`, `suspendido`).
  - **RLS Optimizado:** Se utilizan funciones `SECURITY DEFINER` (`get_my_negocio_id()`, `am_i_admin()`) para las políticas de seguridad, evitando la recursión infinita en PostgreSQL.
- **Frontend (`apps/negocio_admin`):** 
  - Nueva ruta `/equipo` para la gestión de usuarios del tenant.
  - Interfaz premium para visualización y cambio rápido de estados (Activo/Suspendido) con impacto real-time en Supabase.
- **Flujo de Invitación y Onboarding de Comerciales:**
  - **Edge Function:** Uso de `invite-user` que ignora el RLS empleando la `Service Role Key` para invitar usuarios de manera segura.
  - **Redirección:** El enlace del correo redirige hacia `/actualizar-password` mediante las URLs de Site y Redirect configuradas (ej. la URL blanca de Vercel), inyectando variables dinámicas con `{{ .Data }}`.
  - **Activación:** Actualización final de clave con `supabase.auth.updateUser` que establece la contraseña y activa formalmente al usuario en el sistema.

### Notas de Despliegue y RLS (Módulo Equipo)
- **El Problema del Admin Fantasma:** Debido a las estrictas políticas RLS (`get_my_negocio_id()`), el dueño del Tenant DEBE existir en la tabla `usuarios_negocio` con el rol de `admin` para poder visualizar a su equipo. Si no está, la vista de Equipo aparecerá vacía.
- **Redirecciones de Invitación:** Para que los links mágicos apunten a producción, el dominio de Vercel debe estar registrado como **Site URL** y como wildcard (`https://dominio.vercel.app/**`) en los **Redirect URLs** de Supabase Auth.
- **Personalización de Correos:** Las variables enviadas a través del objeto `data` en la Edge Function `invite-user` pueden usarse tanto en el cuerpo del correo como en el **Asunto (Subject)** usando la sintaxis `{{ .Data.nombre_variable }}`.

### ⚠️ Diccionario de Datos y Convenciones (Atención Arquitectos)
- **Inconsistencia de Nomenclatura (Asignaciones de Comerciales):** Para vincular un registro con el usuario vendedor, las tablas utilizan nombres de columna diferentes. **No renombrar en BD** para evitar romper código legacy, pero mapear estrictamente en el Frontend:
  - En la tabla `clientes` -> usar `agente_asignado_id`.
  - En la tabla `oportunidades` -> usar `agente_id`.
  - En la tabla `cotizaciones` -> usar `agente_id`.

## 10. Arquitectura del Dashboard Bifurcado y Enrutamiento por Roles
- **Patrón DashboardWrapper:** El archivo principal `Dashboard.jsx` exporta un contenedor inteligente (`DashboardWrapper`) que evalúa el rol del usuario actual (`user.user_metadata.rol`). Si es 'admin', renderiza el componente encapsulado `<DashboardAdmin/>` (vista 360). Si es 'comercial', renderiza el nuevo componente `<DashboardComercial/>`.
- **Confianza en Políticas RLS:** `<DashboardComercial/>` está diseñado para realizar consultas a las tablas `clientes`, `oportunidades` y `cotizaciones` sin utilizar explícitamente el filtro `.eq('agente_id', user.id)`. Se confía plenamente en las reglas de seguridad de Supabase (RLS) para filtrar la información y devolver únicamente la data que corresponde a dicho usuario.
- **Métrica y Gamificación (Meta de Ventas):**
  - **Nueva columna:** Se agregó la columna `meta_ventas_mensual` (numérico, default 0) en la tabla `usuarios_negocio`.
  - **Uso:** `<DashboardComercial/>` consulta esta columna al cargar e implementa una barra de progreso calculando `(Suma de Cotizaciones Ganadas del mes actual / Meta Mensual) * 100`.
  - **Administración:** El administrador puede editar dinámicamente este objetivo directamente desde la vista de `Equipo.jsx` a través de una edición en línea para cada comercial de su equipo### 11. Módulo de Inventario: Seguridad y RBAC (Solo Lectura para Comerciales)
  
- **Capa de Base de Datos (RLS):** Las tablas `productos`, `categorias`, `almacenes` e `inventario` tienen políticas divididas. La lectura (`SELECT`) es universal para todos los miembros del `negocio_id`. La escritura (`INSERT`, `UPDATE`, `DELETE`) está estrictamente bloqueada mediante la verificación de la función `public.am_i_admin()`.
- **Capa de Interfaz (UX/UI):** Las vistas `CatalogoView.jsx`, `CategoriasView.jsx` y `AlmacenesView.jsx` reaccionan dinámicamente al rol del usuario. Si no es administrador, se ocultan automáticamente los botones de creación (+ Nuevo), importación masiva (CSV) y las columnas de acciones destructivas (Editar/Eliminar).
- **Caso de Uso Comercial:** El agente comercial conserva acceso total de lectura para consultar stock en tiempo real y descargar fichas técnicas, garantizando fricción cero en el armado de sus cotizaciones.
