# 📊 Documentación: Sistema de Gestión de Oportunidades - Vende+CRM

## 🎯 Visión General

El sistema de Oportunidades es el **núcleo del proceso de ventas** en Vende+CRM. Permite gestionar el ciclo completo de una venta desde el primer contacto hasta el cierre del trato, con capacidades predictivas y de automatización.

---

## 🏗️ Arquitectura y Relación Estructural

### **Flujo de Datos entre Secciones:**

```
┌─────────────┐
│   CLIENTES  │ ◄──────────────────┐
└──────┬──────┘                    │
       │                           │
       │ 1. Se crea cliente        │
       │                           │
       ▼                           │
┌─────────────────┐                │
│ OPORTUNIDADES   │                │ 4. Datos del cliente
│                 │                │    se actualizan
│ - Crear trato   │                │
│ - Asignar valor │                │
│ - Seguimiento   │                │
└────────┬────────┘                │
         │                         │
         │ 2. Oportunidad          │
         │    se visualiza         │
         │                         │
         ▼                         │
┌─────────────────┐                │
│  PIPELINE       │                │
│  (Kanban)       │                │
│                 │                │
│ - Drag & Drop   │                │
│ - Cambio etapa  │ ───────────────┘
│ - Estadísticas  │ 3. Actualiza estado
└─────────────────┘    y actividad
```

### **Relaciones de Base de Datos:**

```sql
clientes (tabla principal)
    ├── id (UUID) ──────────┐
    ├── nombre              │
    ├── empresa             │
    ├── email               │
    └── ...                 │
                            │
                            │ FOREIGN KEY
                            │
                            ▼
oportunidades (tabla dependiente)
    ├── id (UUID)
    ├── cliente_id ◄────────┘ (Relación 1:N)
    ├── titulo
    ├── valor_estimado
    ├── etapa
    ├── lead_score
    ├── en_riesgo
    └── ...
```

**Tipo de Relación:** 
- **1 Cliente → N Oportunidades** (Un cliente puede tener múltiples oportunidades de venta)
- **Cascada:** Si se elimina un cliente, se eliminan todas sus oportunidades (`ON DELETE CASCADE`)

---

## 📋 Campos Esenciales de la Pantalla de Oportunidades

### **A. Campos de Identificación y Estado**

| Campo | Tipo | Descripción | Origen |
|-------|------|-------------|--------|
| **Nombre del Acuerdo** | TEXT | Identificador único del trato | Manual |
| **Cliente/Empresa** | FK → clientes | Información del contacto asociado | Relación BD |
| **Etapa Actual** | ENUM | Posición en el embudo (Prospecto → Ganado) | Manual/Drag&Drop |
| **Asignado a** | TEXT | Representante de ventas responsable | Manual |
| **Fecha de Creación** | TIMESTAMP | Cuándo se creó la oportunidad | Automático |

### **B. Campos Financieros y Predictivos**

| Campo | Tipo | Descripción | Origen |
|-------|------|-------------|--------|
| **Valor del Trato** | DECIMAL(12,2) | Ingresos potenciales | Manual |
| **Moneda** | TEXT | PEN, USD, EUR | Manual |
| **Probabilidad de Cierre** | INTEGER (0-100) | % de éxito predicho | Manual/IA |
| **Pronóstico de Cierre** | DATE | Fecha estimada de cierre | Manual |
| **LTV (Lifetime Value)** | DECIMAL(12,2) | Valor de vida del cliente | Manual/Calculado |
| **Lead Score** | INTEGER (0-100) | Puntuación del prospecto | IA/Comportamiento |

### **C. Campos de Actividad y Priorización**

| Campo | Tipo | Descripción | Origen |
|-------|------|-------------|--------|
| **Prioridad** | ENUM | Alta, Media, Baja | Manual |
| **Próxima Tarea** | TEXT | Acción de seguimiento necesaria | Manual |
| **Deadline Tarea** | DATE | Plazo para la próxima acción | Manual |
| **Última Actividad** | TIMESTAMP | Fecha de última interacción | Automático |
| **Días sin Actividad** | INTEGER | Días desde última actualización | Calculado |
| **Atribución/Fuente** | TEXT | Canal que generó el lead | Manual |
| **En Riesgo** | BOOLEAN | Alerta de estancamiento | Automático/IA |
| **Motivo Riesgo** | TEXT | Razón de la alerta | Automático |

---

## 🔄 Automatizaciones Implementadas

### **1. Detección Automática de Riesgos**

El sistema marca automáticamente una oportunidad como "EN RIESGO" cuando:

```sql
-- Trigger automático que se ejecuta cada actualización
UPDATE oportunidades SET en_riesgo = TRUE WHERE:
  - dias_sin_actividad > 14 días
  - fecha_cierre_estimada < CURRENT_DATE (fecha vencida)
  - lead_score < 30 (puntuación muy baja)
```

**Visualización:**
- ⚠️ Icono de alerta rojo en la tabla
- Fila con fondo rojo claro
- Contador en métricas principales

### **2. Actualización Automática de Última Actividad**

Cada vez que se modifica:
- Etapa del embudo
- Probabilidad de cierre
- Valor estimado
- Notas

Se actualiza automáticamente:
```sql
ultima_actividad = NOW()
dias_sin_actividad = 0
en_riesgo = FALSE
```

### **3. Cálculo de Estadísticas en Tiempo Real**

Las métricas se recalculan automáticamente:
- **Total Oportunidades:** COUNT(*)
- **Valor Total Pipeline:** SUM(valor_estimado)
- **Tasa de Conversión:** (ganadas / total) * 100
- **Oportunidades en Riesgo:** COUNT WHERE en_riesgo = TRUE

---

## 🎨 Interfaz de Usuario

### **Pantalla Principal de Oportunidades**

**Componentes:**

1. **Header con Métricas Rápidas** (4 tarjetas)
   - Total Oportunidades
   - Valor Total Pipeline
   - Tasa de Conversión
   - Oportunidades en Riesgo

2. **Barra de Filtros Avanzados**
   - Búsqueda por título/cliente
   - Filtro por Etapa
   - Filtro por Estado
   - Filtro por Prioridad

3. **Tabla Completa** (11 columnas)
   - Nombre del Acuerdo (con tags)
   - Cliente/Empresa (con email)
   - Etapa Actual
   - Valor del Trato
   - Lead Score (barra visual)
   - Probabilidad (barra visual)
   - Pronóstico Cierre
   - Asignado a
   - Fuente/Atribución
   - Estado/Alertas (con indicadores visuales)
   - Acciones (Ver/Editar/Eliminar)

4. **Paginación** (15 oportunidades por página)

### **Modal de Nueva Oportunidad**

**Organizado en 4 secciones:**

1. **Identificación y Estado** (fondo gris claro)
   - Nombre del acuerdo
   - Cliente
   - Etapa actual
   - Asignado a

2. **Información Financiera y Predictiva** (fondo gris claro)
   - Valor del trato + Moneda
   - Probabilidad de cierre
   - Pronóstico de cierre
   - LTV
   - Lead Score

3. **Actividad y Priorización** (fondo gris claro)
   - Prioridad
   - Próxima tarea
   - Deadline
   - Atribución/Fuente (dropdown con opciones)

4. **Información Adicional** (fondo gris claro)
   - Tags
   - Descripción/Notas

---

## 🔗 Integración con Pipeline Kanban

### **Sincronización Bidireccional:**

**Oportunidades → Pipeline:**
- Cada oportunidad creada aparece automáticamente en el Pipeline
- Se ubica en la columna según su `etapa`
- Muestra: título, cliente, valor, probabilidad, tags

**Pipeline → Oportunidades:**
- Al arrastrar una tarjeta en el Kanban:
  1. Se actualiza el campo `etapa` en la BD
  2. Se actualiza `ultima_actividad = NOW()`
  3. Se resetea `dias_sin_actividad = 0`
  4. Se quita la marca `en_riesgo = FALSE`
  5. Si se mueve a "Ganado": `estado = 'ganada'` y `fecha_cierre_real = TODAY`

**Código de sincronización:**
```javascript
// En handleDrop() del Pipeline
const updateData = { 
    etapa: newStage,
    ultimo_contacto: new Date().toISOString()
};

if (newStage === 'ganado') {
    updateData.estado = 'ganada';
    updateData.fecha_cierre_real = new Date().toISOString().split('T')[0];
}

await supabaseClient
    .from('oportunidades')
    .update(updateData)
    .eq('id', oportunidadId);
```

---

## 📊 Casos de Uso

### **Caso 1: Crear Nueva Oportunidad desde Cliente Existente**

1. Usuario va a sección "Oportunidades"
2. Clic en "Nueva Oportunidad"
3. Selecciona cliente del dropdown (cargado desde tabla `clientes`)
4. Llena campos esenciales
5. Sistema crea registro con `user_id` del usuario actual
6. Oportunidad aparece en tabla Y en Pipeline

### **Caso 2: Seguimiento de Oportunidad en Riesgo**

1. Sistema detecta que oportunidad tiene 15 días sin actividad
2. Marca automáticamente `en_riesgo = TRUE`
3. Aparece en tabla con:
   - Fila con fondo rojo claro
   - Icono ⚠️ en columna "Estado/Alertas"
   - Mensaje: "Sin actividad por más de 14 días"
4. Contador "Oportunidades en Riesgo" se incrementa
5. Vendedor ve la alerta y actualiza la oportunidad
6. Al actualizar, se resetea automáticamente el riesgo

### **Caso 3: Mover Oportunidad a "Ganado" desde Pipeline**

1. Usuario arrastra tarjeta a columna "Ganado"
2. Sistema actualiza:
   - `etapa = 'ganado'`
   - `estado = 'ganada'`
   - `fecha_cierre_real = HOY`
3. Estadísticas se recalculan:
   - Tasa de conversión aumenta
   - Valor total se mantiene
4. Oportunidad desaparece del Pipeline (filtro: `estado != 'perdido'`)

---

## 🎯 Beneficios del Sistema

### **Para Vendedores:**
- ✅ Vista completa de todas las oportunidades en un solo lugar
- ✅ Alertas automáticas de oportunidades en riesgo
- ✅ Priorización visual con Lead Score y Probabilidad
- ✅ Recordatorios de tareas pendientes

### **Para Gerentes:**
- ✅ Métricas en tiempo real del pipeline
- ✅ Visibilidad de atribución (ROI de campañas)
- ✅ Identificación de cuellos de botella
- ✅ Previsión de ingresos

### **Para el Negocio:**
- ✅ Reducción de oportunidades perdidas por falta de seguimiento
- ✅ Mejor asignación de recursos (vendedores)
- ✅ Datos para optimizar campañas de marketing
- ✅ Incremento en tasa de conversión

---

## 📁 Archivos Relacionados

| Archivo | Descripción |
|---------|-------------|
| `app.html` | Interfaz completa de Oportunidades (líneas 1293-1438) |
| `CREAR-OPORTUNIDADES-SIMPLE.sql` | Script para crear tabla base |
| `ACTUALIZAR-OPORTUNIDADES-CAMPOS-AVANZADOS.sql` | Script para agregar campos predictivos |
| `DOCUMENTACION-OPORTUNIDADES.md` | Este documento |

---

## 🚀 Próximos Pasos Sugeridos

1. **Implementar IA para Lead Scoring automático**
   - Analizar comportamiento del cliente
   - Asignar puntuación basada en interacciones

2. **Agregar historial de actividades**
   - Log de todos los cambios
   - Timeline visual de interacciones

3. **Notificaciones automáticas**
   - Email cuando una oportunidad está en riesgo
   - Recordatorios de tareas pendientes

4. **Dashboard de análisis**
   - Gráficos de embudo
   - Tendencias de conversión
   - Análisis de fuentes más efectivas

5. **Integración con Email**
   - Enviar propuestas desde el CRM
   - Tracking de emails abiertos
   - Actualizar Lead Score automáticamente

