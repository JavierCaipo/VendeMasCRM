# ⚡ Pasos Rápidos para Desplegar en Vercel

## 🎯 Resumen de 5 Minutos

### ✅ Archivos ya preparados:
- `vercel.json` - Configuración de Vercel
- `.gitignore` - Archivos a ignorar
- `index.html` - Página de entrada
- `package.json` - Información del proyecto
- Código actualizado para detectar URL automáticamente

---

## 📝 PASO 1: Subir a GitHub (2 minutos)

### Opción A: GitHub Desktop (Recomendado)
1. Descarga: https://desktop.github.com/
2. Instala y abre GitHub Desktop
3. File → Add Local Repository → Selecciona `/Users/tresapps/CRM`
4. Si dice "not a git repository", haz clic en "Create a repository"
5. Haz clic en "Publish repository"
6. ✅ Listo

### Opción B: Terminal
```bash
cd /Users/tresapps/CRM
git init
git add .
git commit -m "Initial commit"
# Crea repo en https://github.com/new
git remote add origin https://github.com/TU-USUARIO/vendemascrm.git
git push -u origin main
```

---

## 🚀 PASO 2: Desplegar en Vercel (1 minuto)

1. Ve a: https://vercel.com/signup
2. Haz clic en "Continue with GitHub"
3. Haz clic en "Add New..." → "Project"
4. Busca `vendemascrm` → "Import"
5. Haz clic en "Deploy"
6. Espera 30 segundos
7. ✅ Copia tu URL (ej: `https://vendemascrm.vercel.app`)

---

## 🔧 PASO 3: Configurar Supabase (1 minuto)

1. Ve a: https://app.supabase.com/project/vshlisqaouqptlskcjzg/auth/url-configuration

2. En **"Redirect URLs"**, agrega tu URL de Vercel:
   ```
   https://vendemascrm.vercel.app
   https://vendemascrm.vercel.app/
   ```

3. En **"Site URL"**, pon:
   ```
   https://vendemascrm.vercel.app
   ```

4. Haz clic en "Save"

---

## ✅ PASO 4: Probar (1 minuto)

1. Abre tu URL de Vercel en el navegador
2. Regístrate con tu email
3. Confirma el email
4. Inicia sesión
5. 🎉 ¡Funciona!

---

## 🔄 Actualizar en el Futuro

Cada vez que hagas cambios:

### Con GitHub Desktop:
1. Abre GitHub Desktop
2. Escribe mensaje de commit
3. Haz clic en "Commit to main"
4. Haz clic en "Push origin"
5. Vercel despliega automáticamente en 30 segundos

### Con Terminal:
```bash
git add .
git commit -m "Descripción del cambio"
git push
```

---

## 🆘 Problemas Comunes

### "Email link expired"
- Espera 2 minutos después de configurar Supabase
- Verifica que agregaste la URL correcta

### "404 Not Found"
- Verifica que `vercel.json` esté en la raíz
- Haz redeploy en Vercel

### Cambios no se ven
- Espera 1-2 minutos
- Haz hard refresh (Cmd+Shift+R)

---

## 📱 Bonus: Acceso Móvil

Tu CRM funciona en móviles automáticamente:
1. Abre la URL en tu teléfono
2. Agrega a pantalla de inicio
3. ¡Úsalo como app!

---

## 🎯 Checklist

- [ ] Código en GitHub
- [ ] Desplegado en Vercel
- [ ] URL copiada
- [ ] Supabase configurado
- [ ] Registro de prueba exitoso
- [ ] ✅ CRM funcionando en línea

---

## 🎉 ¡Listo!

Tu CRM está en línea en: `https://tu-url.vercel.app`

**Tiempo total**: ~5 minutos

**Próximos pasos**:
- Comparte la URL con tu equipo
- Personaliza el diseño
- Agrega más funcionalidades

---

**¿Necesitas más detalles?** Lee [DESPLEGAR-VERCEL.md](./DESPLEGAR-VERCEL.md)

