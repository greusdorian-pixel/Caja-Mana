// storage.js — Ahora guarda en archivos JSON dentro de la carpeta datos/
// Usa electronAPI (expuesto por preload.js) para comunicarse con main.js

const Storage = {
    // Cache local para no leer archivos constantemente
    _cache: {},
    // Helper para detectar si estamos en Electron o Web
    async _getData(key) {
        if (window.electronAPI) {
            return await window.electronAPI.getData(key);
        } else {
            const data = localStorage.getItem(key);
            if (data) return JSON.parse(data);
            
            // Valores por defecto si no existe
            const defaults = {
                productos: [
                    { id: 1, nombre: "Almuerzo Completo", categoria: "comida", precio: 3.50, activo: true },
                    { id: 2, nombre: "Segundo", categoria: "comida", precio: 3.00, activo: true },
                    { id: 6, nombre: "Agua 500ml", categoria: "bebida", precio: 0.50, activo: true }
                ],
                ventas: [],
                gastos: [],
                config: { nombreNegocio: "CAJA MANÁ", moneda: "USD" },
                cierres: [],
                fiados: [],
                notas: [],
                historial_mensual: []
            };
            return defaults[key] || [];
        }
    },

    async _setData(key, data) {
        if (window.electronAPI) {
            await window.electronAPI.setData(key, data);
        } else {
            localStorage.setItem(key, JSON.stringify(data));
        }
    },

    async init() {
        // Cargar todos los datos desde archivos o localStorage al iniciar
        this._cache.productos = await this._getData('productos');
        this._cache.ventas = await this._getData('ventas');
        this._cache.gastos = await this._getData('gastos');
        this._cache.config = await this._getData('config');
        this._cache.cierres = await this._getData('cierres');
        this._cache.fiados = await this._getData('fiados');
        this._cache.notas = await this._getData('notas');
        this._cache.historial_mensual = await this._getData('historial_mensual');
    },

    // --- PRODUCTOS ---
    getProductos() {
        return this._cache.productos || [];
    },
    
    getProductosActivos() {
        return this.getProductos().filter(p => p.activo);
    },

    async setProductos(productos) {
        this._cache.productos = productos;
        await this._setData('productos', productos);
    },

    async deleteProducto(id) {
        let productos = this.getProductos();
        productos = productos.filter(p => p.id !== id);
        await this.setProductos(productos);
    },

    // --- VENTAS ---
    getVentas() {
        return this._cache.ventas || [];
    },

    async setVentas(ventas) {
        this._cache.ventas = ventas;
        await this._setData('ventas', ventas);
    },

    async addVenta(venta) {
        const ventas = this.getVentas();
        venta.id = Date.now();
        ventas.push(venta);
        await this.setVentas(ventas);
        return venta;
    },

    // --- GASTOS ---
    getGastos() {
        return this._cache.gastos || [];
    },

    async setGastos(gastos) {
        this._cache.gastos = gastos;
        await this._setData('gastos', gastos);
    },

    async addGasto(gasto) {
        const gastos = this.getGastos();
        gasto.id = Date.now();
        gastos.push(gasto);
        await this.setGastos(gastos);
        return gasto;
    },

    // --- CONFIG ---
    getConfig() {
        return this._cache.config || { nombreNegocio: "CAJA MANÁ", moneda: "USD" };
    },

    async setConfig(config) {
        this._cache.config = config;
        await this._setData('config', config);
    },

    // --- CIERRES ---
    getCierres() {
        return this._cache.cierres || [];
    },

    async addCierre(cierre) {
        const cierres = this.getCierres();
        cierres.push(cierre);
        this._cache.cierres = cierres;
        await this._setData('cierres', cierres);
    },

    // --- FIADOS ---
    getFiados() {
        return this._cache.fiados || [];
    },

    async setFiados(fiados) {
        this._cache.fiados = fiados;
        await this._setData('fiados', fiados);
    },

    async addFiado(fiado) {
        const fiados = this.getFiados();
        fiado.id = Date.now();
        fiados.push(fiado);
        await this.setFiados(fiados);
        return fiado;
    },

    // --- NOTAS ---
    getNotas() {
        return this._cache.notas || [];
    },

    async setNotas(notas) {
        this._cache.notas = notas;
        await this._setData('notas', notas);
    },

    // --- HISTORIAL MENSUAL ---
    getHistorialMensual() {
        return this._cache.historial_mensual || [];
    },

    async setHistorialMensual(historial) {
        this._cache.historial_mensual = historial;
        await this._setData('historial_mensual', historial);
    },

    async addDiaCerrado(diaCerrado) {
        const historial = this.getHistorialMensual();
        historial.push(diaCerrado);
        await this.setHistorialMensual(historial);
    },

    // --- BACKUP ---
    async exportBackup() {
        if (window.electronAPI) {
            return await window.electronAPI.exportBackup();
        } else {
            const data = JSON.stringify(localStorage);
            const blob = new Blob([data], {type: "application/json"});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Backup_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            return { success: true, path: 'Descargas (Navegador)' };
        }
    },

    async importBackup() {
        if (window.electronAPI) {
            return await window.electronAPI.importBackup();
        } else {
            // Un input file invisible para web
            return new Promise((resolve) => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                input.onchange = (e) => {
                    const file = e.target.files[0];
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        try {
                            const data = JSON.parse(event.target.result);
                            for (let key in data) {
                                localStorage.setItem(key, data[key]);
                            }
                            resolve({ success: true });
                        } catch (err) {
                            resolve({ success: false, error: "Archivo JSON inválido" });
                        }
                    };
                    reader.readAsText(file);
                };
                input.click();
            });
        }
    },

    async exportCSV(tipo) {
        if (window.electronAPI) {
            return await window.electronAPI.exportCSV(tipo);
        } else {
            alert("Exportar a Excel solo está disponible en la versión de escritorio por ahora.");
            return { success: false };
        }
    },

    // --- CIERRE DE CAJA ---
    async clearVentasGastosDia() {
        await this.setVentas([]);
        await this.setGastos([]);
    },

    // --- RESET ---
    async resetAll() {
        if (window.electronAPI) {
            return await window.electronAPI.resetData();
        } else {
            localStorage.clear();
            return true;
        }
    },

    // --- RUTA DE DATOS ---
    async getDataPath() {
        if (window.electronAPI) {
            return await window.electronAPI.getDataPath();
        } else {
            return "Almacenamiento Local (Navegador Web/Celular)";
        }
    }
};
