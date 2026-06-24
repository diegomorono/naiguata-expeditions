/* ==========================================================================
   PUNTO DE ENTRADA ADMINISTRATIVO (admin-main.js)
   ========================================================================== */
import { getAdminClient } from './config/supabase.js';
import { setupAdminAuth } from './admin/auth.js';
import { adminStore } from './config/state.js';
import {
    updateDashboardData,
    initCarouselDelegation,
    handleUpdateBCV,
    handleUpdateTourPrice,
    handleUpdateMaxCapacity
} from './admin/core.js';
import { renderRoster, initRosterDelegation } from './admin/roster.js';
import { renderStats, setupExpenseForm } from './admin/finance.js';
import { setupReportButtons } from './admin/reports.js';

function getNextSaturday() {
    const d = new Date();
    let daysUntilSaturday = 6 - d.getDay();
    if (daysUntilSaturday <= 0) daysUntilSaturday += 7;
    d.setDate(d.getDate() + daysUntilSaturday);
    return d.toISOString().split('T')[0];
}

async function loadCapacityDisplay(supabase) {
    try {
        const { data } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', 'max_capacity')
            .single();

        if (data?.value) {
            const val = typeof data.value === 'object'
                ? (data.value.per_date ?? data.value.value ?? data.value)
                : data.value;
            document.querySelectorAll('.max-capacity-display').forEach(el => { el.textContent = val; });
        }
    } catch (err) {
        console.warn('[Admin] No se pudo cargar capacidad remota:', err.message);
    }
}

function showDashboardView() {
    const loginScreen = document.getElementById('admin-login-screen');
    const dashboardView = document.getElementById('admin-dashboard-view');
    if (!loginScreen || !dashboardView) {
        throw new Error('No se encontraron #admin-login-screen / #admin-dashboard-view en el DOM.');
    }
    loginScreen.style.display = 'none';
    dashboardView.style.display = 'block';
}

async function initAdmin() {
    console.log('[Admin] Inicializando consola...');

    // 1. Crear cliente Supabase con service_role token (bypass RLS).
    //    getAdminClient() crea un cliente fresco — nunca reutiliza el anon cacheado.
    const token = sessionStorage.getItem('admin_token');
    if (!token) throw new Error('Token no encontrado. Re-autenticando...');

    const supabase = getAdminClient(token);

    // 2. Inicializar fecha si no existe en el store
    const currentStore = adminStore.get();
    if (!currentStore.selectedDate) {
        adminStore.set({ ...currentStore, selectedDate: getNextSaturday() });
    }

    // 3. Mostrar dashboard
    showDashboardView();

    // 4. Registrar delegaciones de eventos UNA sola vez
    initRosterDelegation();
    initCarouselDelegation(supabase);

    // 5. Cargar datos iniciales y renderizar
    await updateDashboardData(supabase);
    renderRoster();
    renderStats();
    setupExpenseForm();
    setupReportButtons();
    await loadCapacityDisplay(supabase);

    // 6. Conectar botones de ajuste remoto
    document.getElementById('btn-update-bcv')?.addEventListener('click', () => handleUpdateBCV(supabase));
    document.getElementById('btn-update-price')?.addEventListener('click', () => handleUpdateTourPrice(supabase));
    document.getElementById('btn-update-capacity')?.addEventListener('click', () => handleUpdateMaxCapacity(supabase));
}

document.addEventListener('DOMContentLoaded', async () => {
    if (sessionStorage.getItem('admin_token')) {
        try {
            await initAdmin();
        } catch (e) {
            console.warn('[Admin] Sesión inválida, forzando re-login:', e.message);
            sessionStorage.removeItem('admin_token');
            showErrorBanner('Sesión expirada. Por favor inicia sesión de nuevo.');
            document.getElementById('admin-login-screen').style.display = 'flex';
            document.getElementById('admin-dashboard-view').style.display = 'none';
            setupAdminAuth(async () => {
                try { await initAdmin(); } catch (e2) { showErrorBanner(e2.message); }
            });
        }
    } else {
        setupAdminAuth(async () => {
            try { await initAdmin(); } catch (e) { showErrorBanner(e.message); }
        });
    }
});

function showErrorBanner(message) {
    const banner = document.createElement('div');
    banner.style.cssText = `
        position:fixed;top:20px;right:20px;background:#ef4444;color:#fff;
        padding:16px 24px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);
        z-index:9999;font-family:sans-serif;font-size:14px;
    `;
    banner.innerText = message;
    document.body.appendChild(banner);
    setTimeout(() => banner.remove(), 5000);
}