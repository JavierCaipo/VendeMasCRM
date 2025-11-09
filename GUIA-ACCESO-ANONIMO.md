# 🔓 Guía de Configuración de Acceso Anónimo

## 🎯 ¿Qué es el Acceso Anónimo?

El acceso anónimo permite que usuarios **no autenticados** puedan:
- ✅ Ver presupuestos públicos (sin iniciar sesión)
- ✅ Aprobar o rechazar presupuestos desde el link público
- ✅ Realizar pruebas sin crear cuentas

---

## 📋 Configuración en 3 Pasos

### **PASO 1: Habilitar Acceso Anónimo en Supabase** ⚙️

Ya lo hiciste, pero verifica que esté correcto:

1. **Ve a:** https://supabase.com/dashboard/project/vshlisqaouqptlskcjzg/settings/api

2. **Busca la sección "API Settings"**

3. **Verifica que tengas:**
   - ✅ **anon key** (clave pública)
   - ✅ **service_role key** (clave privada - NO compartir)

4. **Copia el `anon key`** (ya lo tienes en app.html)

---

### **PASO 2: Ejecutar Script SQL** 🗄️

1. **Abre Supabase SQL Editor:**
   - https://supabase.com/dashboard/project/vshlisqaouqptlskcjzg/sql/new

2. **Copia TODO el contenido de:**
   - `CONFIGURAR-ACCESO-ANONIMO.sql`

3. **Pégalo en el editor**

4. **Haz clic en "Run"**

5. **Verifica los resultados:**
   - Deberías ver 2 tablas al final:
     - Políticas anónimas por tabla
     - Conteo de políticas

**Resultados esperados:**
```
presupuestos          | 2 políticas
presupuesto_items     | 1 política
clientes              | 1 política
```

---

### **PASO 3: Probar el Acceso Anónimo** 🧪

#### **A. Crear un Presupuesto de Prueba:**

1. **Inicia sesión en la app:**
   - https://vendemas-crm.vercel.app/
   - Email: `admin@vendemas.com`
   - Password: `Admin123456`

2. **Ve a "Presupuestos"**

3. **Haz clic en "Nuevo Presupuesto"**

4. **Completa el formulario:**
   - Cliente: Selecciona o crea uno
   - Fecha de emisión: Hoy
   - Fecha de vencimiento: En 30 días
   - Agrega al menos 1 producto

5. **Haz clic en "Guardar"**

6. **Busca el presupuesto en la tabla**

7. **Haz clic en el botón "Copiar Link"** 📋

---

#### **B. Probar el Link Público:**

1. **Abre una ventana de incógnito/privada:**
   - Chrome: `Cmd+Shift+N` (Mac) o `Ctrl+Shift+N` (Windows)
   - Firefox: `Cmd+Shift+P` (Mac) o `Ctrl+Shift+P` (Windows)
   - Safari: `Cmd+Shift+N`

2. **Pega el link copiado** en la barra de direcciones

3. **Deberías ver:**
   - ✅ El presupuesto completo
   - ✅ Información del cliente
   - ✅ Lista de productos/servicios
   - ✅ Totales calculados
   - ✅ Botones "Aprobar" y "Rechazar"

4. **Haz clic en "Aprobar"**

5. **Deberías ver:**
   - ✅ Mensaje de confirmación
   - ✅ Estado cambia a "Aprobado"
   - ✅ Botones se deshabilitan

---

## 🔍 Verificar que Funciona

### **Checklist de Verificación:**

- [ ] Puedo abrir el link público sin iniciar sesión
- [ ] Veo toda la información del presupuesto
- [ ] Veo la información del cliente
- [ ] Veo todos los productos/servicios
- [ ] Los totales se calculan correctamente
- [ ] Puedo hacer clic en "Aprobar"
- [ ] El estado se actualiza a "Aprobado"
- [ ] Los botones se deshabilitan después de aprobar
- [ ] Si recargo la página, el estado sigue siendo "Aprobado"

---

## 🛡️ Seguridad del Acceso Anónimo

### **¿Qué PUEDEN hacer los usuarios anónimos?**

✅ **Ver presupuestos** que tengan un `link_publico` (UUID)
✅ **Ver items** de esos presupuestos
✅ **Ver información básica** del cliente (nombre, email, teléfono)
✅ **Actualizar el estado** del presupuesto (aprobar/rechazar)

### **¿Qué NO PUEDEN hacer los usuarios anónimos?**

❌ Ver presupuestos sin `link_publico`
❌ Ver TODOS los presupuestos
❌ Crear nuevos presupuestos
❌ Eliminar presupuestos
❌ Modificar precios o productos
❌ Ver otros datos de la base de datos
❌ Acceder al CRM

### **¿Es seguro?**

✅ **SÍ** - Solo pueden acceder a presupuestos con link público
✅ **SÍ** - El UUID es prácticamente imposible de adivinar
✅ **SÍ** - Solo pueden cambiar el estado (aprobar/rechazar)
✅ **SÍ** - No pueden ver datos de otros clientes
✅ **SÍ** - No pueden modificar precios ni productos

---

## 🧪 Pruebas Adicionales (Opcional)

### **Habilitar Acceso Anónimo TOTAL para Pruebas:**

⚠️ **ADVERTENCIA:** Solo para desarrollo/testing. NO usar en producción.

Si quieres permitir acceso anónimo a TODAS las tablas (para pruebas):

1. **Abre:** `CONFIGURAR-ACCESO-ANONIMO.sql`

2. **Busca la sección 4:** "CONFIGURACIÓN PARA PRUEBAS"

3. **Descomenta las líneas** (quita los `--` del inicio)

4. **Ejecuta el script de nuevo**

Esto permitirá:
- ✅ Ver todos los productos (sin autenticación)
- ✅ Ver todos los clientes (sin autenticación)
- ✅ Ver todas las oportunidades (sin autenticación)

**Recuerda:** Esto es SOLO para pruebas. Vuelve a comentar las líneas cuando termines.

---

## 🐛 Solución de Problemas

### **Error: "No se pudo cargar el presupuesto"**

**Causa:** El link público no existe o está mal formado

**Solución:**
1. Verifica que el link sea correcto
2. Asegúrate de que el presupuesto tenga un `link_publico`
3. Ejecuta este SQL para verificar:
   ```sql
   SELECT id, numero, link_publico 
   FROM presupuestos 
   WHERE link_publico IS NOT NULL;
   ```

---

### **Error: "No tienes permisos para ver este presupuesto"**

**Causa:** Las políticas RLS no están configuradas correctamente

**Solución:**
1. Ejecuta el script `CONFIGURAR-ACCESO-ANONIMO.sql` completo
2. Verifica las políticas:
   ```sql
   SELECT tablename, policyname, roles
   FROM pg_policies
   WHERE schemaname = 'public'
   AND 'anon' = ANY(roles);
   ```

---

### **Error: "No se pudo actualizar el estado"**

**Causa:** La política de UPDATE no está configurada

**Solución:**
1. Verifica que existe la política "Actualizar estado de presupuesto público"
2. Ejecuta:
   ```sql
   SELECT * FROM pg_policies 
   WHERE tablename = 'presupuestos' 
   AND policyname LIKE '%público%';
   ```

---

### **El link público no se genera**

**Causa:** La función o trigger no está funcionando

**Solución:**
1. Verifica que el trigger existe:
   ```sql
   SELECT * FROM pg_trigger 
   WHERE tgname LIKE '%presupuesto%';
   ```
2. Si no existe, ejecuta `CREAR-PRODUCTOS-PRESUPUESTOS.sql` de nuevo

---

## 📊 Verificar Políticas Anónimas

### **Ver todas las políticas anónimas:**

```sql
SELECT 
    tablename,
    policyname,
    cmd as operacion,
    CASE 
        WHEN qual IS NOT NULL THEN 'Con condiciones'
        ELSE 'Sin condiciones'
    END as tipo
FROM pg_policies
WHERE schemaname = 'public'
AND 'anon' = ANY(roles)
ORDER BY tablename, policyname;
```

**Deberías ver:**

| Tabla | Política | Operación | Tipo |
|-------|----------|-----------|------|
| presupuestos | Acceso público a presupuestos por link_publico | SELECT | Con condiciones |
| presupuestos | Actualizar estado de presupuesto público | UPDATE | Con condiciones |
| presupuesto_items | Acceso público a items por presupuesto público | SELECT | Con condiciones |
| clientes | Acceso público a clientes en presupuestos | SELECT | Con condiciones |

---

## 🎯 Casos de Uso

### **1. Cliente Aprueba Presupuesto:**

1. Creas presupuesto en el CRM
2. Copias el link público
3. Envías el link al cliente por email/WhatsApp
4. Cliente abre el link (sin cuenta)
5. Cliente revisa el presupuesto
6. Cliente hace clic en "Aprobar"
7. Recibes notificación (en el futuro)
8. Ves el estado "Aprobado" en el CRM

---

### **2. Cliente Rechaza Presupuesto:**

1. Cliente abre el link
2. Revisa el presupuesto
3. Hace clic en "Rechazar"
4. Opcionalmente deja un comentario (en el futuro)
5. Tú ves el estado "Rechazado" en el CRM
6. Puedes crear un nuevo presupuesto ajustado

---

### **3. Presupuesto Vence:**

1. Pasa la fecha de vencimiento
2. El trigger automático marca como "Vencido"
3. Los botones se deshabilitan
4. El cliente ya no puede aprobar/rechazar

---

## 🚀 Próximas Mejoras

Ideas para mejorar el acceso anónimo:

- [ ] Enviar email automático con el link
- [ ] Agregar campo de comentarios al aprobar/rechazar
- [ ] Notificaciones en tiempo real cuando cambia el estado
- [ ] Tracking de cuándo el cliente abrió el link
- [ ] Permitir descargar PDF del presupuesto
- [ ] Agregar firma digital
- [ ] Historial de cambios de estado

---

## ✅ Resumen

### **Lo que configuramos:**

1. ✅ Políticas RLS para acceso anónimo
2. ✅ Acceso público a presupuestos por link
3. ✅ Actualización de estado sin autenticación
4. ✅ Acceso a items y clientes relacionados

### **Resultado:**

- ✅ Los clientes pueden ver presupuestos sin cuenta
- ✅ Los clientes pueden aprobar/rechazar con un clic
- ✅ El sistema es seguro (solo acceso a links públicos)
- ✅ Fácil de compartir (solo copiar y pegar link)

---

## 📞 Soporte

Si tienes problemas:

1. **Abre la consola del navegador** (F12)
2. **Ve a la pestaña "Network"**
3. **Intenta abrir el link público**
4. **Busca errores en rojo**
5. **Comparte el error conmigo**

---

**¡Listo! Ahora tu CRM tiene acceso anónimo configurado correctamente.** 🎉

