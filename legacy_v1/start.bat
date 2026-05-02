@echo off
REM Script de inicio para Vende+CRM en Windows
REM Uso: start.bat

echo.
echo ========================================
echo    Iniciando Vende+CRM...
echo ========================================
echo.

REM Verificar si Node.js está instalado
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js no esta instalado.
    echo.
    echo Por favor, instala Node.js desde: https://nodejs.org/
    echo.
    echo O usa Python en su lugar:
    echo   python -m http.server 3000
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js detectado
node --version
echo.

REM Verificar si el archivo server.js existe
if not exist "server.js" (
    echo [ERROR] No se encuentra el archivo server.js
    echo.
    pause
    exit /b 1
)

REM Verificar si el archivo HTML existe
if not exist "embudo-crm-saas.html" (
    echo [ERROR] No se encuentra el archivo embudo-crm-saas.html
    echo.
    pause
    exit /b 1
)

echo [OK] Archivos encontrados
echo.

echo Iniciando servidor en http://localhost:3000
echo.
echo Instrucciones:
echo   1. Abre tu navegador en: http://localhost:3000
echo   2. Registrate o inicia sesion
echo   3. Para detener el servidor: Ctrl + C
echo.
echo ========================================
echo.

node server.js

