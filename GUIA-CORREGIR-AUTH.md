# 🔧 Guía para Corregir Problemas de Autenticación

## 🎯 Problema
No puedes iniciar sesión o registrarte en la aplicación.

---

## ✅ Solución en 3 Pasos

### **PASO 1: Ejecutar Script SQL** 🗄️

1. **Abre Supabase SQL Editor:**
   - Ve a: https://supabase.com/dashboard/project/vshlisqaouqptlskcjzg/sql

2. **Copia TODO el contenido del archivo:**
   - `CORREGIR-AUTH-PERMANENTE.sql`

3. **Pégalo en el editor SQL**

4. **Haz clic en "Run"** (botón verde)

5. **Verifica los resultados:**
   - Deberías ver 3 tablas de resultados al final:
     - ✅ Tablas con RLS habilitado: 5
     - ✅ Total de políticas RLS: ~25
     - ✅ Usuario de prueba existe: SÍ ✅

---

### **PASO 2: Deshabilitar Confirmación de Email** 📧

1. **Ve a Supabase Dashboard:**
   - https://supabase.com/dashboard/project/vshlisqaouqptlskcjzg/auth/settings

2. **Busca la sección "Email Auth"**

3. **Deshabilita "Enable email confirmations":**
   - Cambia el toggle a **OFF** (desactivado)

4. **Haz clic en "Save"** (guardar)

**Captura de pantalla de referencia:**
```
┌─────────────────────────────────────────┐
│ Email Auth                              │
├─────────────────────────────────────────┤
│ ☐ Enable email confirmations           │  ← Debe estar DESACTIVADO
│                                         │
│ When disabled, users can sign up       │
│ without confirming their email          │
└─────────────────────────────────────────┘
```

---

### **PASO 3: Probar el Login** 🚀

#### **Opción A: Usar Usuario de Prueba**

1. **Abre la app:**
   - https://vendemas-crm.vercel.app/

2. **Haz clic en "Iniciar Sesión"**

3. **Ingresa las credenciales:**
   ```
   Email: admin@vendemas.com
   Password: Admin123456
   ```

4. **Haz clic en "Iniciar Sesión"**

5. **Deberías entrar al CRM** ✅

---

#### **Opción B: Crear Nueva Cuenta**

1. **Abre la app:**
   - https://vendemas-crm.vercel.app/

2. **Haz clic en "Registrarse"**

3. **Completa el formulario:**
   ```
   Nombre: Tu Nombre
   Email: tu@email.com
   Contraseña: TuContraseña123
   Confirmar Contraseña: TuContraseña123
   ```

4. **Haz clic en "Crear Cuenta"**

5. **Deberías ver el mensaje:**
   - "¡Cuenta creada exitosamente! Iniciando sesión..."

6. **Automáticamente deberías entrar al CRM** ✅

---

## 🔍 Verificar que Todo Funciona

### **Checklist de Verificación:**

- [ ] Puedo registrar una nueva cuenta
- [ ] Puedo iniciar sesión con la cuenta creada
- [ ] Puedo ver el Dashboard después de iniciar sesión
- [ ] Puedo crear clientes
- [ ] Puedo crear oportunidades
- [ ] Puedo crear productos
- [ ] Puedo crear presupuestos
- [ ] Puedo cerrar sesión
- [ ] Puedo volver a iniciar sesión

---

## 🐛 Si Aún Tienes Problemas

### **Error: "Invalid login credentials"**

**Causa:** Email o contraseña incorrectos

**Solución:**
1. Verifica que estés usando el email correcto
2. Verifica que la contraseña sea correcta (mínimo 6 caracteres)
3. Intenta con el usuario de prueba: `admin@vendemas.com` / `Admin123456`

---

### **Error: "Email not confirmed"**

**Causa:** La confirmación de email sigue habilitada

**Solución:**
1. Ve al **PASO 2** de esta guía
2. Asegúrate de deshabilitar "Enable email confirmations"
3. Ejecuta este SQL para confirmar usuarios existentes:
   ```sql
   UPDATE auth.users 
   SET email_confirmed_at = NOW()
   WHERE email_confirmed_at IS NULL;
   ```

---

### **Error: "User not found"**

**Causa:** No existe una cuenta con ese email

**Solución:**
1. Verifica que el email sea correcto
2. Intenta registrarte primero
3. O usa el usuario de prueba: `admin@vendemas.com`

---

### **Error: "null value in column 'user_id' violates not-null constraint"**

**Causa:** Las políticas RLS no están configuradas correctamente

**Solución:**
1. Ejecuta el script `CORREGIR-AUTH-PERMANENTE.sql` completo
2. Verifica que todas las políticas se crearon correctamente
3. Cierra sesión y vuelve a iniciar sesión

---

## 📊 Verificar Configuración en Supabase

### **1. Verificar Políticas RLS:**

```sql
-- Ejecuta esto en SQL Editor
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

**Deberías ver ~25 políticas** para las tablas:
- clientes (4 políticas)
- oportunidades (4 políticas)
- productos (4 políticas)
- presupuestos (5 políticas)
- presupuesto_items (5 políticas)

---

### **2. Verificar Usuarios:**

```sql
-- Ejecuta esto en SQL Editor
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;
```

**Deberías ver:**
- Al menos el usuario `admin@vendemas.com`
- `email_confirmed_at` debe tener una fecha (no NULL)

---

### **3. Verificar RLS Habilitado:**

```sql
-- Ejecuta esto en SQL Editor
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('clientes', 'oportunidades', 'productos', 'presupuestos', 'presupuesto_items');
```

**Todas las tablas deben tener `rowsecurity = true`**

---

## 🎯 Resumen

### **Lo que hicimos:**

1. ✅ Corregimos las políticas RLS para que sean más permisivas
2. ✅ Deshabilitamos la confirmación de email
3. ✅ Creamos un usuario de prueba
4. ✅ Mejoramos el manejo de errores en el código
5. ✅ Auto-confirmamos usuarios existentes

### **Resultado esperado:**

- ✅ Puedes registrarte sin confirmar email
- ✅ Puedes iniciar sesión inmediatamente
- ✅ Puedes crear y ver tus datos
- ✅ Los errores son más claros y amigables

---

## 📞 Soporte

Si después de seguir todos estos pasos aún tienes problemas:

1. **Abre la consola del navegador** (F12)
2. **Ve a la pestaña "Console"**
3. **Intenta iniciar sesión**
4. **Copia el error que aparece en rojo**
5. **Compártelo para ayudarte mejor**

---

## 🚀 Próximos Pasos

Una vez que el login funcione:

1. **Importar productos** desde CSV
2. **Crear clientes**
3. **Crear oportunidades**
4. **Generar presupuestos**
5. **Compartir links públicos**

---

**¡Listo! Ahora deberías poder usar el CRM sin problemas de autenticación.** 🎉

