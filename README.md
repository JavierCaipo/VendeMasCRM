# 🚀 Vende+CRM - Sistema de Gestión de Ventas

## 📂 Estructura del Proyecto

```
CRM/
├── README.md                      ← Estás aquí
├── embudo-crm-saas.html          ← 🎯 APLICACIÓN PRINCIPAL (con autenticación)
├── server.js                     ← 🌐 Servidor web para la aplicación
├── start.sh                      ← 🚀 Script de inicio (Mac/Linux)
├── start.bat                     ← 🚀 Script de inicio (Windows)
├── setup-supabase.sql            ← 📊 Script para crear tablas en Supabase
├── COMO-INICIAR.md               ← 📖 Guía de inicio paso a paso
├── SOLUCION-ERROR-EMAIL.md       ← 🔧 Solución a errores comunes
├── INSTRUCCIONES-SUPABASE.md     ← Guía detallada de configuración
└── RESUMEN-FINAL.md              ← Documentación completa
```

---

## 🌟 OPCIÓN RECOMENDADA: Desplegar en Vercel (5 minutos)

**¿Por qué Vercel?**
- ✅ Acceso desde cualquier lugar (no solo localhost)
- ✅ HTTPS automático (más seguro)
- ✅ No necesitas mantener tu computadora encendida
- ✅ Actualizaciones automáticas desde GitHub
- ✅ Completamente GRATIS

**Pasos rápidos**:
1. Sube el proyecto a GitHub
2. Conecta con Vercel
3. Despliega con un clic
4. Configura la URL en Supabase

📖 **Guía completa**: [PASOS-RAPIDOS-VERCEL.md](./PASOS-RAPIDOS-VERCEL.md) (5 minutos)
📖 **Guía detallada**: [DESPLEGAR-VERCEL.md](./DESPLEGAR-VERCEL.md)

---

## 💻 OPCIÓN ALTERNATIVA: Desarrollo Local (4 pasos)

### 1️⃣ Crear las Tablas en Supabase

1. Abre: https://app.supabase.com/project/vshlisqaouqptlskcjzg/sql/new
2. Abre el archivo `setup-supabase.sql`
3. Copia TODO el contenido (Cmd+A, Cmd+C)
4. Pega en el SQL Editor de Supabase (Cmd+V)
5. Haz clic en **"Run"** (botón verde)
6. Espera el mensaje "Success" ✅

### 2️⃣ Configurar URLs en Supabase

1. Ve a: https://app.supabase.com/project/vshlisqaouqptlskcjzg/auth/url-configuration
2. En **"Redirect URLs"**, agrega:
   ```
   http://localhost:3000
   http://localhost:3000/
   ```
3. En **"Site URL"**, pon: `http://localhost:3000`
4. Haz clic en **"Save"**

### 3️⃣ Iniciar el Servidor

**Opción A - Usando el script (Recomendado):**

En Mac/Linux:
```bash
chmod +x start.sh
./start.sh
```

En Windows:
```bash
start.bat
```

**Opción B - Manualmente:**
```bash
node server.js
```

Deberías ver:
```
🚀 Vende+CRM está corriendo!
📍 Abre tu navegador en: http://localhost:3000
```

### 4️⃣ Usar tu CRM

1. Abre tu navegador en: **http://localhost:3000**
2. Haz clic en **"Registrarse"**
3. Ingresa tu email y contraseña
4. Confirma tu email (revisa spam si no llega)
5. Regresa a **http://localhost:3000** e inicia sesión
6. ¡Empieza a agregar clientes! 🎉

---

## 🆘 ¿Problemas?

- **Error "ERR_CONNECTION_REFUSED"**: Lee `COMO-INICIAR.md`
- **Error "Email link expired"**: Lee `SOLUCION-ERROR-EMAIL.md`
- **No tienes Node.js**: Descárgalo de https://nodejs.org/

---

## 📋 Descripción de Archivos

### 🎯 embudo-crm-saas.html
**Aplicación principal del CRM con autenticación Supabase**

Características:
- ✅ Sistema de login y registro
- ✅ Autenticación segura con Supabase
- ✅ Dashboard personalizado por usuario
- ✅ Gestión de clientes
- ✅ Diseño responsive

### 📊 setup-supabase.sql
**Script SQL completo para configurar la base de datos**

Contiene:
- 4 Tablas principales
- 12 Políticas de seguridad RLS
- 10 Índices para rendimiento
- 3 Triggers automáticos

---

## 🔐 Credenciales de Supabase

```
URL: https://vshlisqaouqptlskcjzg.supabase.co
```

**Ya están configuradas en embudo-crm-saas.html** ✅

---

## 🔗 Enlaces Útiles

- **SQL Editor:** https://app.supabase.com/project/vshlisqaouqptlskcjzg/sql
- **Table Editor:** https://app.supabase.com/project/vshlisqaouqptlskcjzg/editor
- **Documentación:** https://supabase.com/docs

---

🚀 **¡Éxito con tu proyecto!**
