#!/bin/bash

# Script de inicio para Vende+CRM
# Uso: ./start.sh

echo ""
echo "🚀 ========================================"
echo "   Iniciando Vende+CRM..."
echo "========================================"
echo ""

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null
then
    echo "❌ Node.js no está instalado."
    echo ""
    echo "Por favor, instala Node.js desde: https://nodejs.org/"
    echo ""
    echo "O usa Python en su lugar:"
    echo "  python3 -m http.server 3000"
    echo ""
    exit 1
fi

echo "✅ Node.js detectado: $(node --version)"
echo ""

# Verificar si el archivo server.js existe
if [ ! -f "server.js" ]; then
    echo "❌ Error: No se encuentra el archivo server.js"
    echo ""
    exit 1
fi

# Verificar si el archivo HTML existe
if [ ! -f "embudo-crm-saas.html" ]; then
    echo "❌ Error: No se encuentra el archivo embudo-crm-saas.html"
    echo ""
    exit 1
fi

echo "✅ Archivos encontrados"
echo ""

# Iniciar el servidor
echo "🌐 Iniciando servidor en http://localhost:3000"
echo ""
echo "📝 Instrucciones:"
echo "   1. Abre tu navegador en: http://localhost:3000"
echo "   2. Regístrate o inicia sesión"
echo "   3. Para detener el servidor: Ctrl + C"
echo ""
echo "========================================"
echo ""

node server.js

