// Servidor simple para Vende+CRM
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const server = http.createServer((req, res) => {
    // Servir el archivo HTML principal
    let filePath = './embudo-crm-saas.html';

    // Si la ruta es raíz, servir el HTML
    if (req.url === '/' || req.url.startsWith('/?') || req.url.startsWith('/#')) {
        filePath = './embudo-crm-saas.html';
    }

    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>404 - Archivo no encontrado</h1>');
            return;
        }

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(content, 'utf-8');
    });
});

server.listen(PORT, () => {
    console.log('');
    console.log('🚀 ========================================');
    console.log('   Vende+CRM está corriendo!');
    console.log('========================================');
    console.log('');
    console.log(`📍 Abre tu navegador en: http://localhost:${PORT}`);
    console.log('');
    console.log('✅ Para detener el servidor: Ctrl + C');
    console.log('');
});

