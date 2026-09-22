const Resumen = {
    init() {
        this.cacheDOM();
        this.bindEvents();
    },

    cacheDOM() {
        this.statVentas = document.getElementById('statVentasTotal');
        this.statGastos = document.getElementById('statGastosTotal');
        this.statGanancia = document.getElementById('statGanancia');
        this.statPlatos = document.getElementById('statPlatos');
        this.statAqui = document.getElementById('statAqui');
        this.statLlevar = document.getElementById('statLlevar');
        
        this.contadoresBody = document.getElementById('contadoresPlatosBody');
        this.historialBody = document.getElementById('historialVentasBody');
        this.btnCerrarCaja = document.getElementById('btnCerrarCaja');
        this.notasTextarea = document.getElementById('notasTextarea');
    },

    bindEvents() {
        if (this.btnCerrarCaja) {
            this.btnCerrarCaja.addEventListener('click', () => this.confirmarCierreCaja());
        }
        if (this.notasTextarea) {
            this.notasTextarea.addEventListener('blur', async () => {
                await Storage.setNotas([this.notasTextarea.value]);
            });
        }
    },

    updateDashboard() {
        const ventas = Storage.getVentas();
        const gastos = Storage.getGastos();
        
        const totalVentas = ventas.reduce((sum, v) => sum + v.total, 0);
        const totalGastos = gastos.reduce((sum, g) => sum + parseFloat(g.monto), 0);
        const ganancia = totalVentas - totalGastos;
        
        this.statVentas.textContent = App.formatMoney(totalVentas);
        this.statGastos.textContent = App.formatMoney(totalGastos);
        this.statGanancia.textContent = App.formatMoney(ganancia);
        
        if (ganancia < 0) {
            this.statGanancia.style.color = "var(--danger)";
        } else {
            this.statGanancia.style.color = "var(--success)";
        }

        const contadores = {};
        let totalPlatos = 0;
        let countAqui = 0;
        let countLlevar = 0;

        ventas.forEach(venta => {
            if (venta.tipo === 'llevar') {
                countLlevar++;
            } else {
                countAqui++;
            }
            venta.items.forEach(item => {
                if (!contadores[item.nombre]) contadores[item.nombre] = 0;
                contadores[item.nombre] += item.cantidad;
                totalPlatos += item.cantidad;
            });
        });

        this.statPlatos.textContent = totalPlatos;
        this.statAqui.textContent = countAqui;
        this.statLlevar.textContent = countLlevar;

        this.contadoresBody.innerHTML = '';
        const sortedContadores = Object.entries(contadores).sort((a, b) => b[1] - a[1]);
        
        if (sortedContadores.length === 0) {
            this.contadoresBody.innerHTML = '<tr><td colspan="2" style="text-align:center;">No hay ventas registradas hoy</td></tr>';
        } else {
            sortedContadores.forEach(([nombre, cantidad]) => {
                this.contadoresBody.innerHTML += `
                    <tr>
                        <td><strong>${nombre}</strong></td>
                        <td><span class="badge badge-active" style="font-size: 1rem;">${cantidad}</span></td>
                    </tr>
                `;
            });
        }

        this.historialBody.innerHTML = '';
        if (ventas.length === 0) {
            this.historialBody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Sin movimientos</td></tr>';
        } else {
            const reversedVentas = [...ventas].reverse();
            reversedVentas.forEach(venta => {
                const resumenItems = venta.items.map(i => `${i.cantidad}x ${i.nombre}`).join(', ');
                const tipoBadge = venta.tipo === 'llevar' 
                    ? '<span style="background:#bbdefb; color:#1565c0; padding:1px 6px; border-radius:3px; font-size:0.7rem; font-weight:600;">📦 LLEVAR</span>'
                    : '<span style="background:#e8f5e9; color:#2e7d32; padding:1px 6px; border-radius:3px; font-size:0.7rem; font-weight:600;">🍽️ AQUÍ</span>';
                this.historialBody.innerHTML += `
                    <tr>
                        <td style="color: var(--text-muted); font-size: 0.9rem;">${App.formatDate(venta.fecha)} ${tipoBadge}</td>
                        <td>
                            <div style="font-size: 0.85rem;" title="${resumenItems}">
                                ${resumenItems.length > 40 ? resumenItems.substring(0, 40) + '...' : resumenItems}
                            </div>
                        </td>
                        <td style="font-weight: bold; color: var(--success);">${App.formatMoney(venta.total)}</td>
                    </tr>
                `;
            });
        }

        if (this.notasTextarea) {
            const notas = Storage.getNotas();
            if (notas.length > 0) {
                this.notasTextarea.value = notas[0];
            }
        }
    },

    confirmarCierreCaja() {
        const ventas = Storage.getVentas();
        if (ventas.length === 0) {
            alert("No hay ventas para cerrar hoy.");
            return;
        }

        const inputMonto = prompt("CIERRE DE CAJA CIEGO\n\nPor favor, cuente el dinero en efectivo que tiene en su caja registradora en este momento y escriba la cantidad:");
        
        if (inputMonto === null) return; // Canceló

        const montoDeclarado = parseFloat(inputMonto);
        if (isNaN(montoDeclarado) || montoDeclarado < 0) {
            alert("Debe ingresar una cantidad válida.");
            return;
        }

        this.ejecutarCierreCaja(montoDeclarado);
    },

    async ejecutarCierreCaja(montoDeclarado) {
        const ventas = Storage.getVentas();
        const gastos = Storage.getGastos();
        
        const totalVentas = ventas.reduce((sum, v) => sum + v.total, 0);
        const totalGastos = gastos.reduce((sum, g) => sum + parseFloat(g.monto), 0);
        
        const gananciaTeorica = totalVentas - totalGastos;
        const diferencia = montoDeclarado - gananciaTeorica;

        let mensajeDiferencia = "";
        if (diferencia === 0) {
            mensajeDiferencia = "¡CAJA CUADRADA PERFECTAMENTE! ($0.00 de diferencia)";
        } else if (diferencia > 0) {
            mensajeDiferencia = `SOBRAN ${App.formatMoney(diferencia)} en caja.`;
        } else {
            mensajeDiferencia = `FALTAN ${App.formatMoney(Math.abs(diferencia))} en caja.`;
        }

        const confirmacionFinal = confirm(
            `Resumen del Cierre:\n\n` +
            `- Ganancia del sistema: ${App.formatMoney(gananciaTeorica)}\n` +
            `- Dinero declarado: ${App.formatMoney(montoDeclarado)}\n` +
            `👉 ${mensajeDiferencia}\n\n` +
            `¿Desea cerrar el día definitivamente? (Los totales de hoy se reiniciarán a 0).`
        );

        if (!confirmacionFinal) return;

        const contadores = {};
        ventas.forEach(v => {
            v.items.forEach(i => {
                if (!contadores[i.nombre]) contadores[i.nombre] = 0;
                contadores[i.nombre] += i.cantidad;
            });
        });

        const cierre = {
            id: Date.now(),
            fecha: new Date().toISOString(),
            totalVentas: totalVentas,
            totalGastos: totalGastos,
            ganancia: gananciaTeorica,
            montoDeclarado: montoDeclarado,
            diferencia: diferencia,
            cantidadVentas: ventas.length,
            detalleVentas: contadores
        };

        // Guardar en cierres y en historial mensual
        await Storage.addCierre(cierre);
        await Storage.addDiaCerrado(cierre);
        
        await Storage.clearVentasGastosDia();
        
        alert("¡Cierre de caja exitoso! Día finalizado.");
        this.updateDashboard();
        if (typeof Gastos !== 'undefined') Gastos.updateTable();
    }
};
