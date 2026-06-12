/* ==========================================================================
   PUNTO DE ENTRADA ADMINISTRATIVO (admin-main.js)
   ========================================================================== */
import { getSupabaseClient } from './config/supabase.js';
import { setupAdminAuth } from './admin/auth.js';
import { updateDashboardData } from './admin/core.js';
import { renderRoster } from './admin/roster.js';

// Nombre consistente: initAdmin
async function initAdmin() {
    console.log("[Naiguatá Admin] Inicializando consola...");
    
    // 1. Asegurar conexión a Supabase
    await getSupabaseClient();
    
    // 2. Ocultar login y mostrar dashboard
    document.querySelector('.login-container').style.display = 'none';
    document.querySelector('.admin-dashboard').style.display = 'block';

    // 3. Cargar datos y renderizar vistas
    await updateDashboardData();
    renderRoster();
    // Aquí irían otras llamadas como renderStats(), etc.
}

document.addEventListener('DOMContentLoaded', () => {
    // Verificación de sesión basada estrictamente en el token JWT
    if (sessionStorage.getItem('admin_token')) {
        initAdmin();
    } else {
        setupAdminAuth(initAdmin); // Pasamos la función como callback
    }
});