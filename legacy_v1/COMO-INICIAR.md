# 🚀 Cómo Iniciar Vende+CRM

## ✅ SOLUCIÓN AL ERROR "ERR_CONNECTION_REFUSED"

El problema es que **no tienes un servidor corriendo en localhost:3000**. 

Cuando haces clic en el enlace de confirmación del email, Supabase intenta redirigirte a `http://localhost:3000`, pero como no hay nada corriendo ahí, obtienes el error de conexión rechazada.

---

## 🎯 OPCIÓN 1: Usar Node.js (Recomendado)

### Paso 1: Verificar que tienes Node.js instalado

Abre tu terminal y ejecuta:
```bash
node --version
```

Si ves un número de versión (ej: `v18.0.0`), tienes Node.js instalado. ✅

Si no lo tienes, descárgalo desde: https://nodejs.org/

### Paso 2: Iniciar el servidor

En la terminal, navega a la carpeta de tu proyecto y ejecuta:

```bash
node server.js
```

Deberías ver:
```
🚀 ========================================
   Vende+CRM está corriendo!
========================================

📍 Abre tu navegador en: http://localhost:3000

✅ Para detener el servidor: Ctrl + C
```

### Paso 3: Abrir en el navegador

1. Abre tu navegador
2. Ve a: **http://localhost:3000**
3. ¡Listo! Ya puedes usar tu CRM

### Paso 4: Confirmar tu email nuevamente

Si ya hiciste clic en el enlace de confirmación antes:
1. El servidor ahora está corriendo
2. Simplemente ve a http://localhost:3000
3. Haz clic en "Iniciar Sesión"
4. Ingresa tu email y contraseña
5. ¡Deberías entrar! 🎉

---

## 🎯 OPCIÓN 2: Usar Python (Si no tienes Node.js)

Si tienes Python instalado, puedes usar su servidor HTTP simple:

### Python 3:
```bash
python3 -m http.server 3000
```

### Python 2:
```bash
python -m SimpleHTTPServer 3000
```

Luego abre: **http://localhost:3000/app.html**

---

## 🎯 OPCIÓN 3: Usar la extensión Live Server de VS Code

Si usas Visual Studio Code:

1. Instala la extensión **"Live Server"**
2. Abre el archivo `app.html`
3. Haz clic derecho → **"Open with Live Server"**
4. Se abrirá en `http://127.0.0.1:5500`

**IMPORTANTE**: Si usas esta opción, necesitas actualizar las URLs en Supabase:
- Ve a Supabase → Authentication → URL Configuration
- Agrega: `http://127.0.0.1:5500`

---

## 🎯 OPCIÓN 4: Usar npx (Sin instalar nada)

Si tienes npm instalado:

```bash
npx http-server -p 3000
```

Luego abre: **http://localhost:3000/app.html**

---

## ✅ Verificar que todo funciona

### 1. El servidor está corriendo
- Deberías ver el mensaje en la terminal
- No cierres la terminal mientras uses el CRM

### 2. Puedes acceder a la aplicación
- Abre http://localhost:3000
- Deberías ver la pantalla de login/registro

### 3. La autenticación funciona
- Regístrate o inicia sesión
- Deberías entrar al dashboard del CRM

---

## 🔧 Solución de Problemas

### Error: "Puerto 3000 ya está en uso"

**Solución 1**: Detén el proceso que está usando el puerto:
```bash
# En Mac/Linux
lsof -ti:3000 | xargs kill -9

# En Windows
netstat -ano | findstr :3000
taskkill /PID <número_del_proceso> /F
```

**Solución 2**: Usa otro puerto:
```bash
node server.js
# Edita server.js y cambia PORT = 3000 a PORT = 8080
```

Luego actualiza las URLs en Supabase a `http://localhost:8080`

### Error: "node: command not found"

Necesitas instalar Node.js:
1. Ve a https://nodejs.org/
2. Descarga la versión LTS
3. Instala y reinicia tu terminal
4. Intenta de nuevo

### El servidor se detiene solo

Asegúrate de:
- No cerrar la terminal
- No presionar Ctrl+C
- Dejar la terminal abierta mientras usas el CRM

---

## 📝 Flujo Completo de Uso

### Primera vez (Registro):

1. **Inicia el servidor**:
   ```bash
   node server.js
   ```

2. **Abre el navegador**: http://localhost:3000

3. **Regístrate**:
   - Haz clic en "Registrarse"
   - Completa el formulario
   - Haz clic en "Registrarse"

4. **Confirma tu email**:
   - Revisa tu bandeja de entrada
   - Haz clic en el enlace de confirmación
   - Serás redirigido a http://localhost:3000

5. **Inicia sesión**:
   - Ingresa tu email y contraseña
   - ¡Listo! 🎉

### Uso diario:

1. **Inicia el servidor**:
   ```bash
   node server.js
   ```

2. **Abre el navegador**: http://localhost:3000

3. **Inicia sesión** con tu email y contraseña

4. **Usa tu CRM** normalmente

5. **Cuando termines**: Presiona Ctrl+C en la terminal para detener el servidor

---

## 🌐 Desplegar en Producción (Opcional)

Si quieres que tu CRM esté disponible en internet:

### Opción A: Vercel (Gratis)
1. Crea una cuenta en https://vercel.com
2. Instala Vercel CLI: `npm i -g vercel`
3. En tu carpeta del proyecto: `vercel`
4. Sigue las instrucciones
5. Actualiza las URLs en Supabase con tu nueva URL

### Opción B: Netlify (Gratis)
1. Crea una cuenta en https://netlify.com
2. Arrastra tu carpeta a Netlify Drop
3. Actualiza las URLs en Supabase

### Opción C: GitHub Pages (Gratis)
1. Sube tu proyecto a GitHub
2. Ve a Settings → Pages
3. Selecciona la rama main
4. Actualiza las URLs en Supabase

---

## 🎉 ¡Listo!

Ahora tu CRM debería funcionar perfectamente.

**Recuerda**:
- ✅ Siempre inicia el servidor antes de usar el CRM
- ✅ Mantén la terminal abierta mientras lo usas
- ✅ Usa http://localhost:3000 (no abras el archivo directamente)

¿Necesitas ayuda? Revisa la sección de solución de problemas arriba.

