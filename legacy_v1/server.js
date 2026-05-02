// Servidor simple para Vende+CRM
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

// Tipos MIME para diferentes archivos
const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.csv': 'text/csv'
};

const server = http.createServer((req, res) => {
    // Determinar el archivo a servir
    let filePath = './app.html';

    // Si la ruta es raíz, servir el HTML
    if (req.url === '/' || req.url.startsWith('/?') || req.url.startsWith('/#')) {
        filePath = './app.html';
    } else {
        // Servir archivos estáticos (imágenes, CSS, etc.)
        filePath = '.' + req.url;
    }

    // Obtener la extensión del archivo
    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    // Leer y servir el archivo
    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 - Archivo no encontrado</h1>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end('Error del servidor: ' + err.code);
            }
            return;
        }

        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
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

