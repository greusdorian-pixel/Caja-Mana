const Fiados = {
    init() {
        this.cacheDOM();
        this.renderFiados();
    },

    cacheDOM() {
        this.listBody = document.getElementById('fiadosListBody');
    },

    renderFiados() {
        if (!this.listBody) return;
        
        const fiados = Storage.getFiados();
        this.listBody.innerHTML = '';

        if (fiados.length === 0) {
            this.listBody.innerHTML = '<tr><td colspan="3" style="text-align:center;">No hay cuentas pendientes</td></tr>';
            return;
        }

        // Agrupar por cliente
        const deudasPorCliente = {};
        fiados.forEach(f => {
            if (!deudasPorCliente[f.cliente]) {
                deudasPorCliente[f.cliente] = { total: 0, items: [] };
            }
            deudasPorCliente[f.cliente].total += f.total;
            deudasPorCliente[f.cliente].items.push(f);
        });

        for (const [cliente, datos] of Object.entries(deudasPorCliente)) {
            if (datos.total <= 0) continue; // Ya pagó todo
            
            this.listBody.innerHTML += `
                <tr>
                    <td style="font-weight:bold;">${cliente}</td>
                    <td style="color:var(--danger); font-weight:bold;">${App.formatMoney(datos.total)}</td>
                    <td>
                        <button class="btn-success" onclick="Fiados.abonar('${cliente}', ${datos.total})" style="padding: 5px 10px; font-size: 0.8rem;">
                            💳 Abonar / Pagar
                        </button>
                    </td>
                </tr>
            `;
        }
    },

    async abonar(cliente, deudaActual) {
        const montoStr = prompt(`El cliente ${cliente} debe ${App.formatMoney(deudaActual)}.\n¿Cuánto desea abonar?`, deudaActual);
        if (montoStr === null) return;
        
        const monto = parseFloat(montoStr);
        if (isNaN(monto) || monto <= 0) {
            alert('Monto inválido');
            return;
        }

        if (monto > deudaActual) {
            alert('El abono no puede ser mayor a la deuda total.');
            return;
        }

        const abono = {
            cliente: cliente,
            total: -monto, // Negativo porque resta a la deuda
            fecha: new Date().toISOString(),
            esAbono: true
        };

        await Storage.addFiado(abono);
        
        // Registrar el abono como una Venta para que ingrese dinero a caja
        await Storage.addVenta({
            fecha: new Date().toISOString(),
            items: [{ nombre: `Abono de deuda: ${cliente}`, cantidad: 1, precio: monto }],
            total: monto,
            recibido: monto,
            cambio: 0,
            tipo: 'aqui',
            numTicket: 0
        });

        this.renderFiados();
        if (typeof Resumen !== 'undefined') Resumen.updateDashboard();
        alert(`Abono de ${App.formatMoney(monto)} registrado con éxito.`);
    }
};
