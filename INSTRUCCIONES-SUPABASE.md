# 📋 Instrucciones de Configuración - Vende+CRM SaaS

## ✅ Datos de Supabase Ya Configurados

El archivo `embudo-crm-saas.html` ya tiene configurados tus datos de Supabase:

- **URL**: `https://vshlisqaouqptlskcjzg.supabase.co`
- **Anon Key**: Ya incluida en el código

## 🗄️ Configuración de Base de Datos en Supabase

Para que el CRM funcione completamente, necesitas crear las siguientes tablas en tu proyecto de Supabase:

### 1. Tabla de Clientes

```sql
CREATE TABLE clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre VARCHAR(255) NOT NULL,
  empresa VARCHAR(255),
  email VARCHAR(255),
  telefono VARCHAR(50),
  etapa VARCHAR(50) DEFAULT 'lead',
  ultimo_contacto TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Habilitar Row Level Security
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver sus propios clientes
CREATE POLICY "Users can view own clientes"
  ON clientes FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Los usuarios solo pueden insertar sus propios clientes
CREATE POLICY "Users can insert own clientes"
  ON clientes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios solo pueden actualizar sus propios clientes
CREATE POLICY "Users can update own clientes"
  ON clientes FOR UPDATE
  USING (auth.uid() = user_id);

-- Política: Los usuarios solo pueden eliminar sus propios clientes
CREATE POLICY "Users can delete own clientes"
  ON clientes FOR DELETE
  USING (auth.uid() = user_id);
```

### 2. Tabla de Oportunidades

```sql
CREATE TABLE oportunidades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT,
  valor DECIMAL(10, 2),
  etapa VARCHAR(50) DEFAULT 'prospecto',
  probabilidad INTEGER DEFAULT 50,
  fecha_cierre_estimada DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Habilitar Row Level Security
ALTER TABLE oportunidades ENABLE ROW LEVEL SECURITY;

-- Políticas similares a clientes
CREATE POLICY "Users can view own oportunidades"
  ON oportunidades FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own oportunidades"
  ON oportunidades FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own oportunidades"
  ON oportunidades FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own oportunidades"
  ON oportunidades FOR DELETE
  USING (auth.uid() = user_id);
```

### 3. Tabla de Actividades

```sql
CREATE TABLE actividades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL, -- 'email', 'llamada', 'reunion', 'nota'
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT,
  fecha TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Habilitar Row Level Security
ALTER TABLE actividades ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Users can view own actividades"
  ON actividades FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own actividades"
  ON actividades FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own actividades"
  ON actividades FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own actividades"
  ON actividades FOR DELETE
  USING (auth.uid() = user_id);
```

## 🚀 Pasos para Configurar en Supabase

1. **Accede a tu proyecto de Supabase**: https://app.supabase.com/project/vshlisqaouqptlskcjzg

2. **Ve a SQL Editor** (en el menú lateral)

3. **Copia y pega** cada uno de los scripts SQL de arriba, uno por uno

4. **Ejecuta** cada script haciendo clic en "Run"

5. **Verifica** que las tablas se crearon correctamente en la sección "Table Editor"

## 🔐 Configuración de Autenticación

La autenticación ya está configurada automáticamente. Supabase maneja:

- ✅ Registro de usuarios
- ✅ Inicio de sesión
- ✅ Verificación de email
- ✅ Recuperación de contraseña
- ✅ Gestión de sesiones

### Configurar Email (Opcional)

Por defecto, Supabase usa emails de prueba. Para producción:

1. Ve a **Authentication > Email Templates**
2. Personaliza los templates de confirmación y recuperación
3. Configura tu proveedor SMTP en **Settings > Auth**

## 📧 Configuración de Email Provider (Producción)

Para emails en producción, configura un proveedor SMTP:

1. Ve a **Settings > Auth > SMTP Settings**
2. Configura tu proveedor (SendGrid, Mailgun, etc.)
3. Ingresa:
   - Host SMTP
   - Puerto
   - Usuario
   - Contraseña
   - Email del remitente

## 🎨 Personalización

El archivo HTML ya incluye:

- ✅ Diseño responsive
- ✅ Autenticación completa (Login/Registro)
- ✅ Dashboard con estadísticas
- ✅ Gestión de clientes
- ✅ Protección de rutas
- ✅ Persistencia de sesión

## 🧪 Probar la Aplicación

1. Abre el archivo `embudo-crm-saas.html` en tu navegador
2. Regístrate con un email válido
3. Confirma tu email (revisa spam si no llega)
4. Inicia sesión
5. ¡Empieza a usar tu CRM!

## 📝 Datos de Ejemplo (Opcional)

Si quieres agregar datos de prueba:

```sql
-- Insertar cliente de ejemplo (reemplaza 'YOUR_USER_ID' con tu ID de usuario)
INSERT INTO clientes (user_id, nombre, empresa, email, telefono, etapa)
VALUES (
  'YOUR_USER_ID',
  'María González',
  'Innovatech',
  'maria@innovatech.com',
  '+1 234 567 890',
  'negociacion'
);
```

Para obtener tu USER_ID:
1. Inicia sesión en la app
2. Abre la consola del navegador (F12)
3. Escribe: `supabaseClient.auth.getUser()`
4. Copia el `id` del usuario

## 🔧 Solución de Problemas

### Error: "Invalid API key"
- Verifica que la URL y la Anon Key sean correctas
- Revisa que no haya espacios extra

### Error: "Email not confirmed"
- Revisa tu bandeja de entrada y spam
- Reenvía el email de confirmación desde Supabase

### No se muestran los datos
- Verifica que las tablas estén creadas
- Confirma que las políticas RLS estén activas
- Revisa la consola del navegador para errores

## 📚 Recursos Adicionales

- [Documentación de Supabase](https://supabase.com/docs)
- [Guía de Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [API de Autenticación](https://supabase.com/docs/reference/javascript/auth-signup)

## 🎯 Próximos Pasos

Una vez configurado, puedes:

1. Agregar más funcionalidades al CRM
2. Crear reportes personalizados
3. Integrar con APIs externas
4. Agregar notificaciones
5. Implementar webhooks

¡Tu CRM SaaS está listo para usar! 🚀
