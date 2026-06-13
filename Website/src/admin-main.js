/* ==========================================================================
   PUNTO DE ENTRADA ADMINISTRATIVO (admin-main.js)
   ========================================================================== */
import { getSupabaseClient } from './config/supabase.js';
import { setupAdminAuth } from './admin/auth.js';
import { updateDashboardData } from './admin/core.js';
import { renderRoster } from './admin/roster.js';
import { renderStats, setupExpenseForm } from './admin/finance.js';

// NOTA: Asegúrate de que 'showErrorBanner' esté disponible globalmente 
// o impórtala aquí si pertenece a un módulo de UI/utilidades.

// Nombre consistente: initAdmin
async function initAdmin() {
    console.log("[Naiguatá Admin] Inicializando consola...");

    // 1. Asegurar conexión a Supabase
    await getSupabaseClient();

    // VINCULACIÓN DE SEGURIDAD PARA LA RECARGA DE PÁGINA
    const tokenGuardado = sessionStorage.getItem('admin_token');
    if (tokenGuardado && window.supabase?.rest?.headers) {
        window.supabase.rest.headers['Authorization'] = `Bearer ${tokenGuardado}`;
    }

    // 2. Ocultar login y mostrar dashboard
    document.querySelector('.login-container').style.display = 'none';
    document.querySelector('.admin-dashboard').style.display = 'block';

    // 3. Cargar datos y renderizar vistas
    await updateDashboardData();
    renderRoster();

    // INICIALIZACIÓN DE TU PANEL FINANCIERO
    renderStats();        // Pinta el total acumulado en USD en tu indicador principal
    setupExpenseForm();   // Activa el "escuchador" de tu formulario seguro de egresos
}

// 1. Transformamos el callback del listener en una función async
document.addEventListener('DOMContentLoaded', async () => {

    // Verificación de sesión basada estrictamente en el token JWT
    if (sessionStorage.getItem('admin_token')) {
        // 2. Bloque seguro para carga con token existente
        try {
            await initAdmin();
        } catch (e) {
            showErrorBanner('No se pudo cargar el panel: ' + e.message);
        }
    } else {
        // 3. Modificamos el callback del flujo de autenticación para que también capture errores post-login
        setupAdminAuth(async () => {
            try {
                await initAdmin();
            } catch (e) {
                showErrorBanner('No se pudo cargar el panel: ' + e.message);
            }
        });
    }
});