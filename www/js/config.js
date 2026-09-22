const Config = {
    init() {
        this.cacheDOM();
        this.bindEvents();
    },

    cacheDOM() {
        this.btnExportar = document.getElementById('btnExportar');
        this.btnImportarSelect = document.getElementById('btnImportarSelect');
        this.fileImportar = document.getElementById('fileImportar');
        this.btnGuardarConfig = document.getElementById('btnGuardarConfig');
        this.btnResetData = document.getElementById('btnResetData');
        this.inNombre = document.getElementById('configNombre');
        this.cierresBody = document.getElementById('cierresTableBody');
    },

    bindEvents() {
        this.btnExportar.addEventListener('click', () => this.exportarBackup());
        this.btnImportarSelect.addEventListener('click', () => this.importarBackup());
        this.btnGuardarConfig.addEventListener('click', () => this.guardarConfig());
        this.btnResetData.addEventListener('click', () => this.resetData());
        
        // Botones CSV (se agregarán en index.html)
        const btnCSVVentas = document.getElementById('btnExportCSVVentas');
        const btnCSVGastos = document.getElementById('btnExportCSVGastos');
        if (btnCSVVentas) btnCSVVentas.addEventListener('click', () => this.exportCSV('ventas'));
        if (btnCSVGastos) btnCSVGastos.addEventListener('click', () => this.exportCSV('gastos'));
    },

    async guardarConfig() {
        const config = Storage.getConfig();
        const nuevoNombre = this.inNombre.value.trim();
        
        if (nuevoNombre) {
            config.nombreNegocio = nuevoNombre;
            await Storage.setConfig(config);
            App.loadConfig();
            alert("Ajustes guardados correctamente.");
        }
    },

    async exportarBackup() {
        const result = await Storage.exportBackup();
        if (result.success) {
            alert("¡Backup guardado exitosamente en:\n" + result.path);
        }
    },

    async importarBackup() {
        const result = await Storage.importBackup();
        if (result.success) {
            alert("¡Datos restaurados con éxito! La aplicación se recargará.");
            location.reload();
        } else if (result.error) {
            alert("Error al restaurar: " + result.error);
        }
    },

    async exportCSV(tipo) {
        const result = await Storage.exportCSV(tipo);
        if (result.success) {
            alert(`¡Archivo Excel guardado en:\n${result.path}`);
        }
    },

    async resetData() {
        const confirm1 = confirm("¡CUIDADO! Estás a punto de borrar TODOS los datos del sistema.\n\n¿Estás seguro?");
        if (!confirm1) return;
        
        const confirm2 = confirm("¿Realmente seguro? No podrás recuperar la información a menos que tengas un backup.");
        if (!confirm2) return;
        
        await Storage.resetAll();
        alert("Sistema reseteado. Se recargará la aplicación.");
        location.reload();
    },

    async updateCierresTable() {
        const cierres = Storage.getCierres();
        this.cierresBody.innerHTML = '';
        
        if (cierres.length === 0) {
            this.cierresBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No hay cierres de caja registrados</td></tr>';
            return;
        }

        const reversedCierres = [...cierres].reverse();

        reversedCierres.forEach(cierre => {
            const gananciaColor = cierre.ganancia >= 0 ? 'var(--success)' : 'var(--danger)';
            
            let declaradoTexto = '-';
            let diferenciaTexto = '-';
            
            if (cierre.montoDeclarado !== undefined) {
                declaradoTexto = App.formatMoney(cierre.montoDeclarado);
                const colorDiferencia = cierre.diferencia === 0 ? 'color: var(--success);' : 'color: var(--danger);';
                diferenciaTexto = `<span style="${colorDiferencia} font-weight:bold;">${App.formatMoney(cierre.diferencia)}</span>`;
            }

            this.cierresBody.innerHTML += `
                <tr>
                    <td style="font-weight: 600;">${App.formatFullDate(cierre.fecha)}</td>
                    <td style="color: var(--primary-color); font-weight: 600;">${App.formatMoney(cierre.totalVentas)}</td>
                    <td style="color: var(--danger); font-weight: 600;">${App.formatMoney(cierre.totalGastos)}</td>
                    <td style="color: ${gananciaColor}; font-weight: bold;">${App.formatMoney(cierre.ganancia)}</td>
                    <td>${declaradoTexto}</td>
                    <td>${diferenciaTexto}</td>
                </tr>
            `;
        });
        
        // Cargar config actual
        const config = Storage.getConfig();
        this.inNombre.value = config.nombreNegocio;

        // Mostrar ruta de datos
        const dataPath = await Storage.getDataPath();
        const pathDisplay = document.getElementById('dataPathDisplay');
        if (pathDisplay) pathDisplay.textContent = dataPath;
    }
};
