const Productos = {
    init() {
        this.cacheDOM();
        this.bindEvents();
    },

    cacheDOM() {
        this.tableBody = document.getElementById('productosTableBody');
        this.btnNuevo = document.getElementById('btnNuevoProducto');
        this.modal = document.getElementById('productoModal');
        this.modalTitle = document.getElementById('productoModalTitle');
        this.form = document.getElementById('formProducto');
        this.inId = document.getElementById('prodId');
        this.inNombre = document.getElementById('prodNombre');
        this.inCategoria = document.getElementById('prodCategoria');
        this.inPrecio = document.getElementById('prodPrecio');
        this.inActivo = document.getElementById('prodActivo');
        this.inStock = document.getElementById('prodStock');
        this.inAlertaStock = document.getElementById('prodAlertaStock');
    },

    bindEvents() {
        this.btnNuevo.addEventListener('click', () => this.abrirModal());
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.guardarProducto();
        });
    },

    renderTable() {
        const productos = Storage.getProductos();
        this.tableBody.innerHTML = '';
        
        if (productos.length === 0) {
            this.tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No hay productos registrados</td></tr>';
            return;
        }

        productos.sort((a, b) => {
            if (a.categoria === b.categoria) return a.nombre.localeCompare(b.nombre);
            return a.categoria.localeCompare(b.categoria);
        });

        productos.forEach(prod => {
            const estadoBadge = prod.activo 
                ? '<span class="badge badge-active">Activo</span>' 
                : '<span class="badge badge-inactive">Inactivo</span>';
                
            let categoriaTexto = prod.categoria;
            if(prod.categoria === 'comida') categoriaTexto = 'Comida';
            if(prod.categoria === 'bebida') categoriaTexto = 'Bebida';
            if(prod.categoria === 'extra') categoriaTexto = 'Extra';

            let stockTexto = '';
            if (prod.stock !== undefined && prod.stock !== '') {
                const stock = parseInt(prod.stock);
                const alerta = parseInt(prod.alertaStock || 0);
                const color = stock <= alerta ? 'color: red; font-weight: bold;' : '';
                stockTexto = `<br><small style="${color}">Stock: ${stock}</small>`;
            }

            this.tableBody.innerHTML += `
                <tr>
                    <td style="font-weight: 600;">${prod.nombre}${stockTexto}</td>
                    <td>${categoriaTexto}</td>
                    <td style="color: var(--primary-color); font-weight: bold;">${App.formatMoney(prod.precio)}</td>
                    <td>${estadoBadge}</td>
                    <td>
                        <button class="btn-primary" style="padding: 5px 10px; font-size: 0.8rem; width:auto;" onclick="Productos.abrirModal(${prod.id})">Editar</button>
                        <button class="btn-danger" style="padding: 5px 10px; font-size: 0.8rem; width:auto; margin-left:5px;" onclick="Productos.eliminarProducto(${prod.id})">X</button>
                    </td>
                </tr>
            `;
        });
    },

    async eliminarProducto(id) {
        if(confirm("¿Estás seguro de eliminar este producto por completo?")) {
            await Storage.deleteProducto(id);
            this.renderTable();
            if (typeof POS !== 'undefined') POS.renderProducts();
        }
    },

    abrirModal(id = null) {
        if (id) {
            const productos = Storage.getProductos();
            const prod = productos.find(p => p.id === id);
            
            this.modalTitle.textContent = "Editar Producto";
            this.inId.value = prod.id;
            this.inNombre.value = prod.nombre;
            this.inCategoria.value = prod.categoria;
            this.inPrecio.value = prod.precio;
            this.inActivo.checked = prod.activo;
            this.inStock.value = prod.stock || '';
            this.inAlertaStock.value = prod.alertaStock || '';
        } else {
            this.modalTitle.textContent = "Nuevo Producto";
            this.form.reset();
            this.inId.value = "";
            this.inActivo.checked = true;
            this.inStock.value = '';
            this.inAlertaStock.value = '';
        }
        
        this.modal.classList.add('active');
        this.inNombre.focus();
    },

    async guardarProducto() {
        const id = this.inId.value;
        const productos = Storage.getProductos();
        
        const nuevoProducto = {
            id: id ? parseInt(id) : Date.now(),
            nombre: this.inNombre.value.trim(),
            categoria: this.inCategoria.value,
            precio: parseFloat(this.inPrecio.value),
            activo: this.inActivo.checked,
            stock: this.inStock.value !== '' ? parseInt(this.inStock.value) : '',
            alertaStock: this.inAlertaStock.value !== '' ? parseInt(this.inAlertaStock.value) : ''
        };
        
        if (id) {
            const index = productos.findIndex(p => p.id === parseInt(id));
            if (index !== -1) productos[index] = nuevoProducto;
        } else {
            productos.push(nuevoProducto);
        }
        
        await Storage.setProductos(productos);
        this.modal.classList.remove('active');
        this.renderTable();
        
        if (typeof POS !== 'undefined') POS.renderProducts();
    }
};
