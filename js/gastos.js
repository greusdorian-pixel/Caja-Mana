const Gastos = {
    init() {
        this.cacheDOM();
        this.bindEvents();
    },

    cacheDOM() {
        this.form = document.getElementById('formGasto');
        this.tableBody = document.getElementById('gastosTableBody');
        this.totalDisplay = document.getElementById('totalGastosDisplay');
        this.inConcepto = document.getElementById('gastoConcepto');
        this.inCategoria = document.getElementById('gastoCategoria');
        this.inMonto = document.getElementById('gastoMonto');
        this.inProveedor = document.getElementById('gastoProveedor');
    },

    bindEvents() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.registrarGasto();
        });
    },

    async registrarGasto() {
        const monto = parseFloat(this.inMonto.value);
        if (isNaN(monto) || monto <= 0) return;

        const gasto = {
            fecha: new Date().toISOString(),
            concepto: this.inConcepto.value.trim(),
            categoria: this.inCategoria.value,
            monto: monto,
            proveedor: this.inProveedor.value.trim()
        };

        await Storage.addGasto(gasto);
        this.form.reset();
        
        const btn = this.form.querySelector('button[type="submit"]');
        const originalText = btn.textContent;
        btn.textContent = "¡REGISTRADO!";
        btn.style.background = "var(--success)";
        
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = "";
        }, 1000);

        this.updateTable();
        if (typeof Resumen !== 'undefined') Resumen.updateDashboard();
    },

    updateTable() {
        const gastos = Storage.getGastos();
        this.tableBody.innerHTML = '';
        let total = 0;

        if (gastos.length === 0) {
            this.tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No hay gastos registrados hoy</td></tr>';
            this.totalDisplay.textContent = "$ 0.00";
            return;
        }

        const categoriasNombres = {
            mercado: 'Mercado',
            plasticos: 'Plásticos',
            tienda: 'Tienda',
            bebidas: 'Bebidas',
            otros: 'Otros'
        };

        const reversedGastos = [...gastos].reverse();

        reversedGastos.forEach(gasto => {
            total += parseFloat(gasto.monto);
            
            this.tableBody.innerHTML += `
                <tr>
                    <td style="color: var(--text-muted); font-size: 0.9rem;">${App.formatDate(gasto.fecha)}</td>
                    <td style="font-weight: 600;">
                        ${gasto.concepto}
                        ${gasto.proveedor ? `<br><small style="color:var(--text-muted); font-weight:normal;">De: ${gasto.proveedor}</small>` : ''}
                    </td>
                    <td><span class="badge badge-inactive" style="background:#e9ecef; color:#495057;">${categoriasNombres[gasto.categoria] || gasto.categoria}</span></td>
                    <td style="color: var(--danger); font-weight: bold;">${App.formatMoney(gasto.monto)}</td>
                </tr>
            `;
        });

        this.totalDisplay.textContent = App.formatMoney(total);
    }
};
