const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Carpeta de datos dentro de la app
const DATA_DIR = path.join(__dirname, 'datos');

// Asegurar que la carpeta datos exista
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Archivos de datos
const FILES = {
    productos: path.join(DATA_DIR, 'productos.json'),
    ventas: path.join(DATA_DIR, 'ventas.json'),
    gastos: path.join(DATA_DIR, 'gastos.json'),
    config: path.join(DATA_DIR, 'config.json'),
    cierres: path.join(DATA_DIR, 'cierres.json'),
    fiados: path.join(DATA_DIR, 'fiados.json'),
    notas: path.join(DATA_DIR, 'notas.json'),
    historial_mensual: path.join(DATA_DIR, 'historial_mensual.json')
};

// Datos por defecto
const DEFAULTS = {
    productos: [
        { id: 1, nombre: "Almuerzo Completo", categoria: "comida", precio: 3.50, activo: true },
        { id: 2, nombre: "Segundo", categoria: "comida", precio: 3.00, activo: true },
        { id: 3, nombre: "Sopa", categoria: "comida", precio: 2.00, activo: true },
        { id: 4, nombre: "Porción de Arroz", categoria: "comida", precio: 1.50, activo: true },
        { id: 5, nombre: "Porción de Segundo", categoria: "comida", precio: 2.00, activo: true },
        { id: 6, nombre: "Agua 500ml", categoria: "bebida", precio: 0.50, activo: true },
        { id: 7, nombre: "Agua 1 Litro", categoria: "bebida", precio: 1.00, activo: true },
        { id: 8, nombre: "Agua 1.5 Litros", categoria: "bebida", precio: 1.50, activo: true },
        { id: 9, nombre: "Agua Galón", categoria: "bebida", precio: 2.00, activo: true }
    ],
    ventas: [],
    gastos: [],
    config: { nombreNegocio: "CAJA MANÁ", moneda: "USD" },
    cierres: [],
    fiados: [],
    notas: [],
    historial_mensual: []
};

// ============= FUNCIONES DE LECTURA/ESCRITURA DE ARCHIVOS =============

function readData(key) {
    const filePath = FILES[key];
    try {
        if (fs.existsSync(filePath)) {
            const raw = fs.readFileSync(filePath, 'utf-8');
            return JSON.parse(raw);
        }
    } catch (err) {
        console.error(`Error leyendo ${key}:`, err);
    }
    // Si no existe o hay error, crear con defaults
    const defaultData = DEFAULTS[key] || [];
    writeData(key, defaultData);
    return defaultData;
}

function writeData(key, data) {
    const filePath = FILES[key];
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
        return true;
    } catch (err) {
        console.error(`Error escribiendo ${key}:`, err);
        return false;
    }
}

// ============= IPC HANDLERS (Comunicación con la interfaz) =============

// Leer datos
ipcMain.handle('getData', (event, key) => {
    return readData(key);
});

// Escribir datos
ipcMain.handle('setData', (event, key, data) => {
    return writeData(key, data);
});

// Exportar backup (Guardar como...)
ipcMain.handle('exportBackup', async () => {
    const fecha = new Date().toISOString().split('T')[0];
    const result = await dialog.showSaveDialog({
        title: 'Guardar Backup',
        defaultPath: `CajaMana_Backup_${fecha}.json`,
        filters: [{ name: 'JSON', extensions: ['json'] }]
    });

    if (!result.canceled && result.filePath) {
        const allData = {};
        for (const key of Object.keys(FILES)) {
            allData[key] = readData(key);
        }
        allData.fechaExportacion = new Date().toISOString();
        fs.writeFileSync(result.filePath, JSON.stringify(allData, null, 2), 'utf-8');
        return { success: true, path: result.filePath };
    }
    return { success: false };
});

// Importar backup
ipcMain.handle('importBackup', async () => {
    const result = await dialog.showOpenDialog({
        title: 'Seleccionar Backup',
        filters: [{ name: 'JSON', extensions: ['json'] }],
        properties: ['openFile']
    });

    if (!result.canceled && result.filePaths.length > 0) {
        try {
            const raw = fs.readFileSync(result.filePaths[0], 'utf-8');
            const data = JSON.parse(raw);
            for (const key of Object.keys(FILES)) {
                if (data[key]) {
                    writeData(key, data[key]);
                }
            }
            return { success: true };
        } catch (err) {
            return { success: false, error: err.message };
        }
    }
    return { success: false };
});

// Exportar a CSV (Excel)
ipcMain.handle('exportCSV', async (event, tipo) => {
    const fecha = new Date().toISOString().split('T')[0];
    const result = await dialog.showSaveDialog({
        title: `Exportar ${tipo} a Excel`,
        defaultPath: `CajaMana_${tipo}_${fecha}.csv`,
        filters: [{ name: 'CSV (Excel)', extensions: ['csv'] }]
    });

    if (!result.canceled && result.filePath) {
        const data = readData(tipo);
        let csv = '';

        if (tipo === 'ventas') {
            csv = 'Fecha,Hora,Items,Total,Recibido,Cambio\n';
            data.forEach(v => {
                const fecha = new Date(v.fecha);
                const items = v.items.map(i => `${i.cantidad}x ${i.nombre}`).join(' + ');
                csv += `${fecha.toLocaleDateString()},${fecha.toLocaleTimeString()},"${items}",${v.total},${v.recibido},${v.cambio}\n`;
            });
        } else if (tipo === 'gastos') {
            csv = 'Fecha,Concepto,Categoria,Monto,Proveedor\n';
            data.forEach(g => {
                const fecha = new Date(g.fecha);
                csv += `${fecha.toLocaleDateString()},"${g.concepto}",${g.categoria},${g.monto},"${g.proveedor || ''}"\n`;
            });
        }

        fs.writeFileSync(result.filePath, '\uFEFF' + csv, 'utf-8'); // BOM para que Excel lea acentos
        return { success: true, path: result.filePath };
    }
    return { success: false };
});

// Reset de datos
ipcMain.handle('resetData', () => {
    for (const key of Object.keys(FILES)) {
        writeData(key, DEFAULTS[key] || []);
    }
    return true;
});

// Obtener ruta de datos para mostrar al usuario
ipcMain.handle('getDataPath', () => {
    return DATA_DIR;
});

// ============= VENTANA PRINCIPAL =============

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1366,
        height: 768,
        minWidth: 1024,
        minHeight: 600,
        title: 'CAJA MANÁ - Sistema de Registro',
        icon: path.join(__dirname, 'assets', 'logo.jpg'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    mainWindow.loadFile('index.html');
    
    // Quitar menú por defecto (aspecto más limpio)
    mainWindow.setMenuBarVisibility(false);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
