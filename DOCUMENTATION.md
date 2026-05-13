# VendeMasCRM v1.0 — Documentación Maestra

Bienvenidos a la documentación oficial de **VendeMasCRM**, una plataforma SaaS B2B Multi-Tenant diseñada para ofrecer una experiencia operativa de clase mundial con integración de Inteligencia Artificial.

---

## Índice

1. [Documentación Técnica (Arquitectura & Stack)](#1-documentación-técnica-arquitectura--stack)
2. [Manual del Business Admin (Gestión de Negocio)](#2-manual-del-business-admin-gestión-de-negocio)
3. [Manual del Comercial (Uso Táctico Móvil)](#3-manual-del-comercial-uso-táctico-móvil)

---

## 1. Documentación Técnica (Arquitectura & Stack)

### Arquitectura Monorepo
VendeMasCRM adopta una arquitectura de **Monorepo** estructurada para separar lógicamente los dominios de la aplicación, facilitando la escalabilidad y el mantenimiento:
- **`apps/negocio_admin/`**: Interfaz principal (CRM) orientada a los inquilinos (Tenants) y sus equipos comerciales. Posee toda la lógica de clientes, ventas, pipeline y métricas.
- **`apps/super_admin/`**: Panel de control global para los administradores del SaaS. Gestiona suscripciones, creación de nuevos tenants y parámetros maestros del sistema.

### Stack Tecnológico
- **Frontend**: Vite + React
- **Estilos**: Tailwind CSS con un enfoque de **Diseño Adaptativo Híbrido** (Mobile-First UI para comerciales, Desktop Grid para administradores) y directrices de *Glassmorphism*.
- **Gestión de Estado y Caché**: `useSWR` (*Stale-While-Revalidate*) proporciona hidratación instantánea de datos (cargas de 0ms entre vistas) y refetching inteligente en segundo plano.

### Backend & Realtime (Supabase)
Toda la infraestructura de datos está respaldada por **Supabase**:
- **Base de Datos**: PostgreSQL con esquema multi-tenant seguro.
- **Auth & RLS**: Autenticación estandarizada con políticas de Row Level Security (RLS) que aplican la **"Regla del Cerco"** (`negocio_id = tenant_id`), garantizando que los datos no se filtren entre organizaciones.
- **Tiempo Real**: Suscripciones a `postgres_changes` para refrescar SWR y los componentes sin recargar la página (ej. en el Pipeline de Oportunidades).

### Motor de IA (Integración Gemini)
El sistema incluye un agente conversacional y analítico accionado por Google Gemini:
- **Fallback Dinámico**: Para evitar caídas por deprecación de modelos, el motor itera sobre un array de *fallbacks* (`['gemini-1.5-flash-latest', 'gemini-1.5-flash', 'gemini-pro', ...]`) hasta obtener una respuesta exitosa (Status 200).
- **Parser Resiliente**: Un parser de JSON potenciado por *Regex* elimina artefactos markdown (````json ... ````) devolviendo siempre objetos puros (`{ "sentimiento": "...", "resumen_ia": "..." }`).

### Lógica de Negocio Avanzada
#### Lead Scoring Dinámico
El porcentaje de cierre de una oportunidad no es estático, se calcula reactivamente:
- **Base por Etapa**: Prospecto (20%) → Calificado (30%) → Propuesta (50%) → Negociación (80%) → Cerrado (100%).
- **Penalización por Deal Rot**: Si una oportunidad permanece inactiva, se le resta un factor de podredumbre (`diasInactivo * 2`) afectando su *Scoring* (con un mínimo de retención del 5%).

---

## 2. Manual del Business Admin (Gestión de Negocio)

Este manual está dirigido al Gerente Comercial o Administrador del Tenant.

### 1. Configuración de Metas
El motor predictivo del Dashboard necesita conocer los objetivos mensuales del equipo:
- Accede a los ajustes del usuario o directamente desde el panel administrativo para establecer el campo `meta_ventas_mensual`.
- Este valor alimenta directamente la **barra de progreso** y el algoritmo de cálculo de **Cierres Faltantes**.

### 2. Catálogo de Productos
- **Gestión de Inventario**: Registra productos con su respectivo código SKU. 
- **Escala de Tarifas**: VendeMasCRM admite tarifas diferenciadas (A, B, C) por producto. Al asignar una categoría a un cliente, el cotizador jalará la tarifa correspondiente por defecto.
- **Validación de Stock**: Ingresa la cantidad en el módulo de inventarios. El cotizador advertirá visualmente a los vendedores si intentan vender por encima del stock disponible.

### 3. Dashboard de Control 
La vista de escritorio ofrece una visión global tipo "Centro de Mando":
- **KPIs Principales**: Total en Embudo, Cierres Ganados, Oportunidades Activas y Ticket Promedio.
- **Sentimiento IA**: Un gráfico de dona que tabula el estado emocional de las interacciones recientes registradas por los vendedores, permitiendo anticipar riesgos.
- **Proyección Predictiva**: El sistema analiza el ticket promedio del mes y te indica matemáticamente cuántos "cierres" necesita realizar tu equipo para alcanzar la meta monetaria.

### 4. Gestión de Usuarios
- Otorga roles (`comercial`, `admin`) a los miembros del equipo.
- El RLS de la base de datos limitará automáticamente qué pueden eliminar o configurar, pero les dará visibilidad completa para colaborar en el pipeline.

---

## 3. Manual del Comercial (Uso Táctico Móvil)

Este manual está optimizado para los ejecutivos de campo que utilizan la aplicación desde su *smartphone*.

### 1. Experiencia Móvil
- **Navecriptción Táctil**: Utiliza la **Bottom Tab Bar** (Barra Inferior) para saltar rápidamente entre Dashboard, Clientes, Cotizaciones y Pipeline usando una sola mano.
- **Carruseles y Swipe**: Las métricas del dashboard móvil son deslizables lateralmente (*snap-x*). 

### 2. Gestión de Clientes y Seguimiento (Timeline)
Dentro de la vista del cliente, tienes acceso a la bitácora de interacciones:
- Agrega notas de reuniones o llamadas de forma rápida.
- **Inteligencia Artificial**: Cada nota es analizada automáticamente. Observa los *Badges* para priorizar:
  - 🟢 **Positivo**: El lead muestra interés o acuerdo.
  - ⚪ **Neutral**: Interacción de seguimiento o informativa.
  - 🔴 **Negativo**: El lead tiene objeciones serias o fricciones.
- Lee el **Resumen IA** (máximo 12 palabras) debajo de notas largas para no tener que leer el bloque completo de texto.

### 3. Cotizador Express
La creación de cotizaciones está pensada para no entorpecer el flujo de ventas:
- **Layout Táctil**: El modal de detalle de productos presenta un selector ancho (`100%`) y botones de gran tamaño.
- **Automatización de Tarifas**: Selecciona al cliente y el producto; el precio se autocompletará con la tarifa base (ej. Tarifa A). Debajo del campo de precio verás la cifra sugerida como referencia en texto pequeño.
- **Validaciones In-Situ**: 
  - Al poner la `Cantidad`, si supera el stock real, el texto del inventario parpadeará en rojo.
  - Los descuentos porcentuales recalculan inmediatamente el subtotal de la línea (con fondo resaltado) para poder negociar en tiempo real.

### 4. Pipeline y Cierres
- Mueve tus Oportunidades de estado para actualizar las métricas de la empresa.
- **Probabilidad**: El `%` que aparece en tu oportunidad refleja qué tan cerca estás del cierre. Si no tocas una oportunidad en varios días, este porcentaje bajará (Deal Rot). ¡Mantén tus oportunidades activas!
