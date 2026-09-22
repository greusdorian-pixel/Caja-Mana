const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..');
const destDir = path.join(__dirname, '..', 'www');

// Carpetas y archivos a copiar
const toCopy = [
    'css',
    'js',
    'assets',
    'index.html',
    'manifest.json',
    'service-worker.js'
];

// Crear carpeta www si no existe
if (!fs.existsSync(destDir)){
    fs.mkdirSync(destDir);
}

function copyRecursiveSync(src, dest) {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();
    if (isDirectory) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest);
        }
        fs.readdirSync(src).forEach(function(childItemName) {
            copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
        });
    } else {
        if (exists) {
            fs.copyFileSync(src, dest);
        }
    }
}

toCopy.forEach(item => {
    const srcPath = path.join(srcDir, item);
    const destPath = path.join(destDir, item);
    if (fs.existsSync(srcPath)) {
        copyRecursiveSync(srcPath, destPath);
        console.log(`Copiado: ${item}`);
    } else {
        console.warn(`No se encontró: ${item}`);
    }
});

console.log('Build web completado en carpeta www/');
