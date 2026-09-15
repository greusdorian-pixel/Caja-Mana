const POS = {
    ticket: [],
    tipoPedido: 'aqui', // 'aqui' o 'llevar'
    
    init() {
        this.cacheDOM();
        this.bindEvents();
        this.renderProducts();
    },
    
    cacheDOM() {
        this.productsList = document.getElementById('posProductsList');
        this.ticketContainer = document.getElementById('ticketItems');
        this.subtotalEl = document.getElementById('posSubtotal');
        this.totalEl = document.getElementById('posTotal');
        this.inputRecibido = document.getElementById('montoRecibido');
        this.cambioEl = document.getElementById('posCambio');
        this.btnCobrar = document.getElementById('btnCobrar');
        this.btnFiar = document.getElementById('btnFiar');
        this.btnTipoAqui = document.getElementById('btnTipoAqui');
        this.btnTipoLlevar = document.getElementById('btnTipoLlevar');
    },
    
    bindEvents() {
        this.inputRecibido.addEventListener('input', () => this.calculateChange());
        this.btnCobrar.addEventListener('click', () => this.processPayment());
        if (this.btnFiar) {
            this.btnFiar.addEventListener('click', () => this.processFiar());
        }
    },

    playSound(type) {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            if (type === 'success') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
                gain.gain.setValueAtTime(0.5, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
                osc.start();
                osc.stop(ctx.currentTime + 0.1);
            } else if (type === 'error') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(150, ctx.currentTime);
                gain.gain.setValueAtTime(0.5, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
                osc.start();
                osc.stop(ctx.currentTime + 0.3);
            }
        } catch (e) {
            console.error("Audio no soportado");
        }
    },

    setTipoPedido(tipo) {
        this.tipoPedido = tipo;
        if (tipo === 'aqui') {
            this.btnTipoAqui.style.background = 'var(--primary-color)';
            this.btnTipoAqui.style.color = 'white';
            this.btnTipoLlevar.style.background = 'white';
            this.btnTipoLlevar.style.color = 'var(--text-main)';
        } else {
            this.btnTipoLlevar.style.background = 'var(--primary-color)';
            this.btnTipoLlevar.style.color = 'white';
            this.btnTipoAqui.style.background = 'white';
            this.btnTipoAqui.style.color = 'var(--text-main)';
        }
    },
    
    renderProducts() {
        const productos = Storage.getProductosActivos();
        this.productsList.innerHTML = '';
        
        if(productos.length === 0) {
            this.productsList.innerHTML = '<div style="padding:20px; text-align:center;">No hay productos activos. Vaya a Precios para agregarlos.</div>';
            return;
        }

        const categorias = {
            comida: productos.filter(p => p.categoria === 'comida'),
            bebida: productos.filter(p => p.categoria === 'bebida'),
            extra: productos.filter(p => p.categoria === 'extra')
        };

        const config = {
            comida: { title: 'Comidas y Platos', color: '#0d6efd' },
            bebida: { title: 'Bebidas', color: '#0dcaf0' },
            extra: { title: 'Extras', color: '#ffc107' }
        };

        for (const [key, items] of Object.entries(categorias)) {
            if (items.length === 0) continue;

            const section = document.createElement('div');
            section.className = 'category-section';
            
            const title = document.createElement('h3');
            title.textContent = config[key].title;
            title.style.borderBottomColor = config[key].color;
            section.appendChild(title);

            const grid = document.createElement('div');
            grid.className = 'products-grid';

            items.forEach(prod => {
                const btn = document.createElement('button');
                btn.className = 'btn-product';
                
                // Mostrar stock si tiene
                let stockHTML = '';
                if (prod.stock !== undefined && prod.stock !== '') {
                    const alerta = prod.alertaStock || 0;
                    const stockNum = parseInt(prod.stock);
                    const colorStock = stockNum <= alerta ? 'color: red;' : 'color: var(--text-muted);';
                    stockHTML = `<div style="font-size: 0.7rem; margin-top: 5px; ${colorStock}">Stock: ${stockNum}</div>`;
                }

                btn.innerHTML = `
                    <span class="prod-name">${prod.nombre}</span>
                    <span class="prod-price">${App.formatMoney(prod.precio)}</span>
                    ${stockHTML}
                `;
                
                if (prod.stock !== undefined && prod.stock !== '' && parseInt(prod.stock) <= 0) {
                    btn.disabled = true;
                    btn.style.opacity = '0.5';
                    btn.innerHTML += `<div style="color:red; font-size: 0.7rem; font-weight:bold;">AGOTADO</div>`;
                } else {
                    btn.onclick = () => this.addToTicket(prod);
                }
                
                grid.appendChild(btn);
            });

            section.appendChild(grid);
            this.productsList.appendChild(section);
        }
    },
    
    addToTicket(producto) {
        const existingItem = this.ticket.find(item => item.id === producto.id);
        
        // Validar límite de stock temporalmente en la cuenta
        if (producto.stock !== undefined && producto.stock !== '') {
            const stockActual = parseInt(producto.stock);
            const cantidadEnTicket = existingItem ? existingItem.cantidad : 0;
            if (cantidadEnTicket >= stockActual) {
                this.playSound('error');
                return;
            }
        }

        if (existingItem) {
            existingItem.cantidad++;
        } else {
            this.ticket.push({
                id: producto.id,
                nombre: producto.nombre,
                precio: producto.precio,
                cantidad: 1,
                tieneStock: producto.stock !== undefined && producto.stock !== ''
            });
        }
        
        this.renderTicket();
    },
    
    removeFromTicket(id) {
        this.ticket = this.ticket.filter(item => item.id !== id);
        this.renderTicket();
    },

    updateQuantity(id, change) {
        const item = this.ticket.find(item => item.id === id);
        if (item) {
            item.cantidad += change;
            if (item.cantidad <= 0) {
                this.removeFromTicket(id);
            } else {
                this.renderTicket();
            }
        }
    },
    
    renderTicket() {
        this.ticketContainer.innerHTML = '';
        let total = 0;
        
        if (this.ticket.length === 0) {
            this.ticketContainer.innerHTML = '<div style="text-align: center; color: var(--text-muted); margin-top: 50px;">Seleccione productos para agregar a la cuenta</div>';
            this.updateTotals(0);
            return;
        }
        
        this.ticket.forEach(item => {
            const itemTotal = item.precio * item.cantidad;
            total += itemTotal;
            
            const div = document.createElement('div');
            div.className = 'ticket-item';
            div.innerHTML = `
                <div class="item-name">${item.nombre}</div>
                <div class="item-qty">
                    <button class="qty-btn" onclick="POS.updateQuantity(${item.id}, -1)">-</button>
                    <span>${item.cantidad}</span>
                    <button class="qty-btn" onclick="POS.updateQuantity(${item.id}, 1)">+</button>
                </div>
                <div class="item-total">${App.formatMoney(itemTotal)}</div>
                <button class="item-remove" onclick="POS.removeFromTicket(${item.id})">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 7l16 0" /><path d="M10 11l0 6" /><path d="M14 11l0 6" /><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" /><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" /></svg>
                </button>
            `;
            this.ticketContainer.appendChild(div);
        });
        
        this.updateTotals(total);
        this.ticketContainer.scrollTop = this.ticketContainer.scrollHeight;
    },
    
    updateTotals(total) {
        this.currentTotal = total;
        this.subtotalEl.textContent = App.formatMoney(total);
        this.totalEl.textContent = App.formatMoney(total);
        this.calculateChange();
    },

    setMontoRecibido(monto) {
        if (monto === 'exacto') {
            this.inputRecibido.value = this.currentTotal;
        } else {
            this.inputRecibido.value = monto;
        }
        this.calculateChange();
    },
    
    calculateChange() {
        if (this.ticket.length === 0) {
            this.btnCobrar.disabled = true;
            if (this.btnFiar) this.btnFiar.disabled = true;
            this.cambioEl.textContent = "$ 0.00";
            this.cambioEl.style.color = "var(--text-main)";
            return;
        }

        if (this.btnFiar) this.btnFiar.disabled = false;

        const recibido = parseFloat(this.inputRecibido.value) || 0;
        
        if (recibido >= this.currentTotal) {
            const cambio = recibido - this.currentTotal;
            this.cambioEl.textContent = App.formatMoney(cambio);
            this.cambioEl.style.color = "var(--success)";
            this.btnCobrar.disabled = false;
        } else {
            this.cambioEl.textContent = "Falta Dinero";
            this.cambioEl.style.color = "var(--danger)";
            this.btnCobrar.disabled = (recibido > 0);
        }

        if (this.inputRecibido.value === "") {
            this.cambioEl.textContent = "$ 0.00 (Exacto)";
            this.cambioEl.style.color = "var(--success)";
            this.btnCobrar.disabled = false;
        }
    },
    
    async processPayment() {
        if (this.ticket.length === 0) return;
        
        const recibido = parseFloat(this.inputRecibido.value) || this.currentTotal;
        const cambio = recibido - this.currentTotal;

        // Generar número de ticket
        const ventas = Storage.getVentas();
        const numTicket = ventas.length + 1;
        
        const venta = {
            fecha: new Date().toISOString(),
            items: [...this.ticket],
            total: this.currentTotal,
            recibido: recibido,
            cambio: cambio,
            tipo: this.tipoPedido, // 'aqui' o 'llevar'
            numTicket: numTicket
        };
        
        await Storage.addVenta(venta);
        
        // Restar stock
        await this.deductStock();

        // Efecto visual de éxito y sonido
        this.playSound('success');
        const tipoTexto = this.tipoPedido === 'aqui' ? '¡COBRADO! (Aquí)' : '¡COBRADO! (Llevar)';
        this.btnCobrar.textContent = tipoTexto;
        this.btnCobrar.style.background = "var(--success)";
        
        setTimeout(() => {
            this.clearTicket();
            this.btnCobrar.textContent = "COBRAR";
            this.btnCobrar.style.background = "";
            this.renderProducts(); // refrescar stock
            if (typeof Resumen !== 'undefined') Resumen.updateDashboard();
        }, 1200);
    },

    async processFiar() {
        if (this.ticket.length === 0) return;

        const cliente = prompt(`Total a fiar: ${App.formatMoney(this.currentTotal)}\nIngrese el nombre del cliente:`);
        if (!cliente || cliente.trim() === '') {
            this.playSound('error');
            return;
        }

        const fiado = {
            cliente: cliente.trim(),
            items: [...this.ticket],
            total: this.currentTotal,
            fecha: new Date().toISOString(),
            esAbono: false
        };

        await Storage.addFiado(fiado);
        await this.deductStock();
        this.playSound('success');

        this.btnFiar.textContent = "¡FIADO!";
        this.btnFiar.style.background = "var(--success)";

        setTimeout(() => {
            this.clearTicket();
            this.btnFiar.textContent = "FIAR";
            this.btnFiar.style.background = "var(--warning)";
            this.renderProducts(); // refrescar stock
            if (typeof Fiados !== 'undefined') Fiados.renderFiados();
        }, 1200);
    },

    async deductStock() {
        const productos = Storage.getProductos();
        let changed = false;
        
        this.ticket.forEach(item => {
            if (item.tieneStock) {
                const p = productos.find(prod => prod.id === item.id);
                if (p && p.stock !== undefined && p.stock !== '') {
                    p.stock = Math.max(0, parseInt(p.stock) - item.cantidad);
                    changed = true;
                }
            }
        });

        if (changed) {
            await Storage.setProductos(productos);
        }
    },
    
    clearTicket() {
        this.ticket = [];
        this.inputRecibido.value = '';
        this.tipoPedido = 'aqui';
        this.setTipoPedido('aqui');
        this.renderTicket();
    }
};
