# 🎉 Instrucciones Finales - Vende+CRM

## ✅ Cambios Completados

### 1. **Logos Corregidos** ✅
- ✅ Ahora muestra icono + texto si las imágenes no existen
- ✅ Fallback automático a `<i class="fas fa-chart-line"></i> Vende+CRM`
- ✅ Funciona en ambos modos (light/dark)

### 2. **Base de Datos Actualizada** ✅
- ✅ Tabla adaptada para recibir datos del Excel
- ✅ Nuevos campos: customer_id, tipo_documento, numero_documento, direccion, ciudad, pais, estado_cliente
- ✅ Generación automática de customer_id (CUST-001, CUST-002, etc.)

### 3. **Formulario Completo** ✅
- ✅ Todos los campos del Excel incluidos
- ✅ Validaciones mejoradas
- ✅ Interfaz más profesional

### 4. **Carga Masiva Mejorada** ✅
- ✅ Acepta formato Excel completo
- ✅ También acepta formato simple
- ✅ Detección automática del formato

---

## 📋 PASO 1: Actualizar Tabla en Supabase

### **Ve al SQL Editor:**
```
https://app.supabase.com/project/vshlisqaouqptlskcjzg/sql/new
```

### **Ejecuta este SQL:**

```sql
-- Eliminar tabla existente (CUIDADO: Borra todos los datos)
DROP TABLE IF EXISTS clientes CASCADE;

-- Crear tabla con todos los campos
CREATE TABLE clientes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    
    -- Campos del Excel
    customer_id TEXT UNIQUE,
    nombre TEXT NOT NULL,
    empresa TEXT,
    contacto_principal TEXT,
    email TEXT NOT NULL,
    telefono TEXT,
    tipo_documento TEXT,
    numero_documento TEXT,
    direccion TEXT,
    ciudad TEXT,
    pais TEXT DEFAULT 'Perú',
    estado_cliente TEXT DEFAULT 'Activo',
    fecha_registro DATE DEFAULT CURRENT_DATE,
    usuario_registro TEXT,
    
    -- Campos CRM
    etapa TEXT DEFAULT 'prospecto',
    ultimo_contacto TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notas TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_clientes_user_id ON clientes(user_id);
CREATE INDEX idx_clientes_customer_id ON clientes(customer_id);
CREATE INDEX idx_clientes_email ON clientes(email);

-- RLS
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own clientes"
    ON clientes FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clientes"
    ON clientes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clientes"
    ON clientes FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own clientes"
    ON clientes FOR DELETE USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_clientes_updated_at
    BEFORE UPDATE ON clientes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

---

## 📄 PASO 2: Convertir Excel a CSV

### **Opción A: Desde Excel**

1. **Abre tu archivo Excel** (`Clientes_EPP_Corregido.xlsx`)
2. **Archivo → Guardar Como**
3. **Tipo**: CSV (delimitado por comas) (*.csv)
4. **Nombre**: `clientes-importar.csv`
5. **Guardar**

### **Opción B: Usar el archivo de ejemplo**

Ya incluí un archivo `ejemplo-clientes.csv` con el formato correcto del Excel.

---

## 🧪 PASO 3: Probar Localmente

```bash
# Inicia el servidor
node server.js

# Abre el navegador
http://localhost:3000
```

### **Pruebas:**

#### 1. **Verificar Logo**
- ✅ Debe mostrar icono + texto "Vende+CRM"
- ✅ Visible en modo light y dark

#### 2. **Nuevo Cliente**
- ✅ Haz clic en "Nuevo Cliente"
- ✅ Llena todos los campos
- ✅ Guarda
- ✅ Verifica que aparece en la tabla con customer_id (CUST-001)

#### 3. **Carga Masiva**
- ✅ Haz clic en "Carga Masiva"
- ✅ Selecciona `ejemplo-clientes.csv` o tu archivo convertido
- ✅ Revisa la vista previa
- ✅ Haz clic en "Cargar Clientes"
- ✅ Verifica que todos aparecen en la tabla

---

## 📊 Estructura de la Tabla

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| customer_id | TEXT | ID único del cliente | CUST-001 |
| nombre | TEXT | Nombre completo | Juan Pérez |
| empresa | TEXT | Nombre de la empresa | Construcción |
| contacto_principal | TEXT | Persona de contacto | Juan Pérez |
| email | TEXT | Email principal | juan@email.com |
| telefono | TEXT | Teléfono | 999111222 |
| tipo_documento | TEXT | DNI, RUC, ONI | DNI |
| numero_documento | TEXT | Número del documento | 12345678 |
| direccion | TEXT | Dirección completa | Av. Independencia 123 |
| ciudad | TEXT | Ciudad | Arequipa |
| pais | TEXT | País | Perú |
| estado_cliente | TEXT | Activo/Inactivo | Activo |
| etapa | TEXT | Etapa del embudo | prospecto |

---

## 📤 PASO 4: Subir a GitHub

```bash
# Agregar cambios
git add .

# Commit
git commit -m "Actualizar base de datos para Excel, corregir logos, mejorar formularios"

# Push
git push
```

Vercel desplegará automáticamente en 1-2 minutos.

---

## 🎨 Formato CSV Aceptado

### **Formato Completo (Excel):**
```csv
customer_id,name,company,contact_person,email1,phone_number,tipo_documento,numero_documento,direccion,ciudad,pais,estado_cliente
CUST-001,Juan Pérez,Construcción,Juan Pérez,juan@email.com,999111222,DNI,12345678,Av. Independencia 123,Arequipa,Perú,Activo
```

### **Formato Simple:**
```csv
nombre,empresa,email,telefono,etapa
Juan Pérez,Construcción,juan@email.com,999111222,prospecto
```

---

## 🔧 Solución de Problemas

### **Los logos no se ven**
✅ **SOLUCIONADO**: Ahora muestra icono + texto automáticamente si las imágenes no existen.

### **Error al guardar cliente**
**Problema**: La tabla no tiene los campos nuevos  
**Solución**: Ejecuta el SQL del PASO 1 para actualizar la tabla

### **Error al cargar CSV**
**Problema**: Formato incorrecto  
**Solución**: Usa el archivo `ejemplo-clientes.csv` como referencia

### **Customer_id duplicado**
**Problema**: Ya existe un cliente con ese ID  
**Solución**: El sistema genera IDs automáticamente, no los repitas

---

## 📁 Archivos Creados/Modificados

| Archivo | Estado | Descripción |
|---------|--------|-------------|
| `app.html` | ✅ Modificado | Logos con fallback, formulario completo, tabla actualizada |
| `ejemplo-clientes.csv` | ✅ Actualizado | Formato Excel completo |
| `ACTUALIZAR-TABLA-CLIENTES.sql` | ✅ Nuevo | Script SQL para actualizar la tabla |
| `INSTRUCCIONES-FINALES.md` | ✅ Nuevo | Este archivo |

---

## ✅ Checklist Final

Antes de subir a GitHub:

- [ ] Ejecutar SQL en Supabase (PASO 1)
- [ ] Convertir Excel a CSV (PASO 2)
- [ ] Probar "Nuevo Cliente" localmente
- [ ] Probar "Carga Masiva" con tu CSV
- [ ] Verificar que los logos se ven (icono + texto)
- [ ] Verificar que la tabla muestra todos los campos
- [ ] Subir a GitHub con `git push`

---

## 🎉 ¡Listo!

Ahora tu CRM:

✅ Muestra logos correctamente (con fallback)  
✅ Acepta datos completos del Excel  
✅ Genera customer_id automáticamente  
✅ Formulario con todos los campos  
✅ Carga masiva desde Excel  
✅ Tabla completa con 8 columnas  

**¿Necesitas ayuda?** Avísame si tienes algún problema.

