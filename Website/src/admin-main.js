/* ==========================================================================
   PUNTO DE ENTRADA ADMINISTRATIVO (admin-main.js)
   ========================================================================== */
import { getSupabaseClient } from './config/supabase.js';
import { setupAdminAuth } from './admin/auth.js';
import { updateDashboardData } from './admin/core.js';
import { renderRoster } from './admin/roster.js';
import { renderStats, setupExpenseForm } from './admin/finance.js'; // ← IMPORTAMOS TU MÓDULO FINANCIERO

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

document.addEventListener('DOMContentLoaded', () => {
    // Verificación de sesión basada estrictamente en el token JWT
    if (sessionStorage.getItem('admin_token')) {
        initAdmin();
    } else {
        setupAdminAuth(initAdmin); // Pasamos la función como callback
    }
});