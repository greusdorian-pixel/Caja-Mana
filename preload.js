const { contextBridge, ipcRenderer } = require('electron');

// Expone funciones seguras al frontend (la interfaz HTML)
contextBridge.exposeInMainWorld('electronAPI', {
    // Leer datos de un archivo
    getData: (key) => ipcRenderer.invoke('getData', key),
    
    // Escribir datos a un archivo
    setData: (key, data) => ipcRenderer.invoke('setData', key, data),
    
    // Backup completo
    exportBackup: () => ipcRenderer.invoke('exportBackup'),
    importBackup: () => ipcRenderer.invoke('importBackup'),
    
    // Exportar a CSV (Excel)
    exportCSV: (tipo) => ipcRenderer.invoke('exportCSV', tipo),
    
    // Reset
    resetData: () => ipcRenderer.invoke('resetData'),
    
    // Ruta de datos
    getDataPath: () => ipcRenderer.invoke('getDataPath')
});
