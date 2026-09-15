// Controlador principal de la aplicación y navegación
const App = {
    async init() {
        // Inicializar storage PRIMERO (carga datos desde archivos)
        await Storage.init();
        
        this.setupNavigation();
        this.loadConfig();
        
        // Inicializar los otros módulos
        if (typeof POS !== 'undefined') POS.init();
        if (typeof Resumen !== 'undefined') Resumen.init();
        if (typeof Productos !== 'undefined') Productos.init();
        if (typeof Gastos !== 'undefined') Gastos.init();
        if (typeof Config !== 'undefined') Config.init();
    },

    setupNavigation() {
        const tabs = document.querySelectorAll('.nav-tab');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                tabs.forEach(t => t.classList.remove('active'));
                
                const clickedTab = e.currentTarget;
                clickedTab.classList.add('active');
                
                document.querySelectorAll('.module').forEach(m => {
                    m.classList.remove('active');
                });
                
                const targetId = clickedTab.getAttribute('data-target');
                document.getElementById(targetId).classList.add('active');
                
                this.refreshModule(targetId);
            });
        });
    },
    
    refreshModule(moduleId) {
        switch(moduleId) {
            case 'module-pos':
                if (typeof POS !== 'undefined') POS.renderProducts();
                break;
            case 'module-resumen':
                if (typeof Resumen !== 'undefined') Resumen.updateDashboard();
                break;
            case 'module-precios':
                if (typeof Productos !== 'undefined') Productos.renderTable();
                break;
            case 'module-gastos':
                if (typeof Gastos !== 'undefined') Gastos.updateTable();
                break;
            case 'module-config':
                if (typeof Config !== 'undefined') Config.updateCierresTable();
                break;
        }
    },
    
    loadConfig() {
        const config = Storage.getConfig();
        document.getElementById('displayBusinessName').textContent = config.nombreNegocio;
    },
    
    formatMoney(amount) {
        return `$ ${parseFloat(amount).toFixed(2)}`;
    },
    
    formatDate(dateString) {
        const d = new Date(dateString);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    },
    
    formatFullDate(dateString) {
        const d = new Date(dateString);
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
};

// Iniciar aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
