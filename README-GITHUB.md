# 🚀 Vende+CRM - Sistema de Gestión de Clientes

<div align="center">

![Vende+CRM](https://img.shields.io/badge/Vende+CRM-v1.0-blue)
![Supabase](https://img.shields.io/badge/Supabase-Enabled-green)
![License](https://img.shields.io/badge/license-MIT-blue)

**Un CRM moderno, simple y potente para gestionar tus clientes y oportunidades de venta.**

[Demo en Vivo](#) | [Documentación](./DESPLEGAR-VERCEL.md) | [Reportar Bug](../../issues)

</div>

---

## ✨ Características

- 🔐 **Autenticación Segura** - Sistema completo de login y registro con Supabase
- 👥 **Gestión de Clientes** - Administra tus contactos y prospectos
- 💰 **Pipeline de Ventas** - Seguimiento de oportunidades y cierres
- 📊 **Dashboard Intuitivo** - Visualiza tus métricas en tiempo real
- 📱 **Responsive** - Funciona perfectamente en móviles y tablets
- 🎨 **Diseño Moderno** - Interfaz limpia y profesional
- 🔒 **Seguridad RLS** - Row Level Security de Supabase
- ⚡ **Tiempo Real** - Sincronización instantánea de datos

---

## 🎯 Demo Rápido

```bash
# Clona el repositorio
git clone https://github.com/TU-USUARIO/vendemascrm.git

# Navega al directorio
cd vendemascrm

# Inicia el servidor local
node server.js

# Abre en tu navegador
# http://localhost:3000
```

---

## 📋 Requisitos Previos

- Cuenta en [Supabase](https://supabase.com) (gratis)
- Node.js 14+ (para desarrollo local)
- Cuenta en [Vercel](https://vercel.com) (opcional, para producción)

---

## 🚀 Instalación y Configuración

### 1. Configurar Supabase

1. Crea un proyecto en [Supabase](https://supabase.com)
2. Ejecuta el script SQL en `setup-supabase.sql`
3. Configura las URLs de autenticación en Supabase Dashboard

**Guía detallada**: Ver [INSTRUCCIONES-SUPABASE.md](./INSTRUCCIONES-SUPABASE.md)

### 2. Desarrollo Local

```bash
# Instalar dependencias (opcional)
npm install

# Iniciar servidor de desarrollo
node server.js

# O usar el script de inicio
./start.sh  # Mac/Linux
start.bat   # Windows
```

### 3. Desplegar en Producción

**Opción recomendada: Vercel**

1. Haz fork de este repositorio
2. Conecta tu repositorio con Vercel
3. Despliega con un clic
4. Actualiza las URLs en Supabase

**Guía completa**: Ver [DESPLEGAR-VERCEL.md](./DESPLEGAR-VERCEL.md)

---

## 📁 Estructura del Proyecto

```
vendemascrm/
├── index.html                    # Página de entrada
├── app.html         # Aplicación principal
├── server.js                     # Servidor de desarrollo
├── setup-supabase.sql           # Script de base de datos
├── vercel.json                   # Configuración de Vercel
├── .gitignore                    # Archivos ignorados por Git
│
├── DESPLEGAR-VERCEL.md          # Guía de despliegue
├── COMO-INICIAR.md              # Guía de inicio
├── SOLUCION-ERROR-EMAIL.md      # Solución de problemas
└── README.md                     # Este archivo
```

---

## 🛠️ Tecnologías Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Hosting**: Vercel
- **Autenticación**: Supabase Auth
- **Base de Datos**: PostgreSQL (Supabase)
- **Seguridad**: Row Level Security (RLS)

---

## 📊 Funcionalidades Principales

### 🔐 Autenticación
- Registro de usuarios
- Login/Logout
- Confirmación por email
- Recuperación de contraseña
- Sesiones persistentes

### 👥 Gestión de Clientes
- Crear, editar y eliminar clientes
- Clasificación por etapas (Lead, Prospecto, Negociación, Ganado, Perdido)
- Búsqueda y filtrado
- Historial de contactos

### 💼 Oportunidades de Venta
- Seguimiento de deals
- Valor estimado y probabilidad
- Fechas de cierre
- Estados personalizables

### 📈 Dashboard
- Métricas en tiempo real
- Gráficos de pipeline
- Estadísticas de conversión
- Actividad reciente

---

## 🔒 Seguridad

- ✅ Row Level Security (RLS) habilitado
- ✅ Autenticación JWT
- ✅ HTTPS en producción
- ✅ Validación de datos en cliente y servidor
- ✅ Políticas de acceso por usuario

---

## 🤝 Contribuir

¡Las contribuciones son bienvenidas!

1. Haz fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📝 Roadmap

- [ ] Integración con WhatsApp
- [ ] Notificaciones por email
- [ ] Exportación a Excel/PDF
- [ ] Reportes personalizados
- [ ] Integración con calendarios
- [ ] API REST
- [ ] App móvil nativa
- [ ] Modo oscuro

---

## 🐛 Reportar Problemas

¿Encontraste un bug? [Abre un issue](../../issues/new)

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

## 👨‍💻 Autor

**Tu Nombre**
- GitHub: [@TU-USUARIO](https://github.com/TU-USUARIO)
- Email: tu@email.com

---

## 🙏 Agradecimientos

- [Supabase](https://supabase.com) - Por el increíble BaaS
- [Vercel](https://vercel.com) - Por el hosting gratuito
- [Font Awesome](https://fontawesome.com) - Por los iconos

---

## 📞 Soporte

¿Necesitas ayuda?

- 📖 Lee la [documentación](./DESPLEGAR-VERCEL.md)
- 🐛 [Reporta un bug](../../issues)
- 💬 [Discusiones](../../discussions)

---

<div align="center">

**⭐ Si este proyecto te fue útil, considera darle una estrella ⭐**

Hecho con ❤️ por [Tu Nombre]

</div>

