/* ==========================================================================
   PUNTO DE ENTRADA ADMINISTRATIVO (admin-main.js)
   ========================================================================== */
import { getAdminClient } from './config/supabase.js';
import { setupAdminAuth } from './admin/auth.js';
import { adminStore } from './config/state.js';
import {
    getExpeditionDates,
    renderExpeditionCarousel,
    updateDashboardData,
    initCarouselDelegation,
    initDateRangeFilter,
    handleUpdateBCV,
    handleUpdateTourPrice,
    handleUpdateMaxCapacity
} from './admin/core.js';
import { initRosterDelegation } from './admin/roster.js';
import { setupExpenseForm } from './admin/finance.js';
import { setupReportButtons } from './admin/reports.js';

/* ──────────────────────────────────────────────────────────────────────────
   Selecciona la fecha más apropiada al abrir el panel:
   1. La fecha más próxima futura con registros.
   2. Si no hay futuras, la más reciente pasada con registros.
   3. Si no hay ninguna, el próximo sábado (estado vacío esperado).
   ────────────────────────────────────────────────────────────────────────── */
function pickBestDate(dates) {
    if (!dates.length) {
        const d = new Date();
        let diff = 6 - d.getDay();
        if (diff <= 0) diff += 7;
        d.setDate(d.getDate() + diff);
        return d.toISOString().split('T')[0];
    }

    const today = new Date().toISOString().split('T')[0];
    const future = dates.filter(d => d >= today);
    return future.length ? future[0] : dates[dates.length - 1];
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
            document.querySelectorAll('.max-capacity-display')
                .forEach(el => { el.textContent = val; });
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

    // 1. Crear cliente con service_role token — bypasea RLS completamente.
    const token = sessionStorage.getItem('admin_token');
    if (!token) throw new Error('Token no encontrado.');

    const supabase = getAdminClient(token);

    // 2. Mostrar dashboard
    showDashboardView();

    // 3. Registrar delegaciones de eventos UNA sola vez sobre contenedores estables.
    //    Deben registrarse antes de cualquier render para no perder clics.
    initRosterDelegation();

    // Closure que siempre devuelve las fechas actuales (respeta filtro de rango)
    const getAllDates = () => getExpeditionDates(supabase);
    initCarouselDelegation(supabase, getAllDates);
    initDateRangeFilter(getAllDates);

    // 4. Obtener todas las fechas con registros y elegir la mejor automáticamente
    const dates = await getExpeditionDates(supabase);
    const bestDate = pickBestDate(dates);

    adminStore.set({ ...adminStore.get(), selectedDate: bestDate });

    // 5. Renderizar carrusel con la fecha correcta ya activa
    renderExpeditionCarousel(dates);

    // 6. Cargar datos de la fecha seleccionada (roster, stats, logística, checklist)
    await updateDashboardData(supabase);

    // 7. Inicializar formularios y botones independientes del ciclo de datos
    setupExpenseForm();
    setupReportButtons();
    await loadCapacityDisplay(supabase);

    document.getElementById('btn-update-bcv')
        ?.addEventListener('click', () => handleUpdateBCV(supabase));
    document.getElementById('btn-update-price')
        ?.addEventListener('click', () => handleUpdateTourPrice(supabase));
    document.getElementById('btn-update-capacity')
        ?.addEventListener('click', () => handleUpdateMaxCapacity(supabase));
}

document.addEventListener('DOMContentLoaded', async () => {
    if (sessionStorage.getItem('admin_token')) {
        try {
            await initAdmin();
        } catch (e) {
            console.warn('[Admin] Error al iniciar sesión:', e.message);
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
        z-index:9999;font-family:sans-serif;font-size:14px;font-weight:600;
    `;
    banner.innerText = message;
    document.body.appendChild(banner);
    setTimeout(() => banner.remove(), 5000);
}