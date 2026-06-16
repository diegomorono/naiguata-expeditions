/* ==========================================================================
   PUNTO DE ENTRADA ADMINISTRATIVO (admin-main.js)
   ========================================================================== */
import { getSupabaseClient } from './config/supabase.js';
import { setupAdminAuth } from './admin/auth.js';
import { adminStore } from './config/state.js';
// MODIFICACIÓN: Importamos las funciones controladoras premium desde core.js
import {
    updateDashboardData,
    handleUpdateBCV,
    handleUpdateTourPrice,
    handleUpdateMaxCapacity
} from './admin/core.js';
import { renderRoster } from './admin/roster.js';
import { renderStats, setupExpenseForm } from './admin/finance.js';

// Función auxiliar para calcular el próximo sábado
function getNextSaturday() {
    const d = new Date();
    let daysUntilSaturday = 6 - d.getDay();
    if (daysUntilSaturday <= 0) daysUntilSaturday += 7;
    d.setDate(d.getDate() + daysUntilSaturday);
    return d.toISOString().split('T')[0];
}

// NUEVA FUNCIÓN: Consulta el límite de aforo y actualiza los placeholders del HTML
async function renderAdminCapacitySettings(supabase) {
    try {
        console.log("[Naiguatá Admin] Cargando configuraciones de aforo desde Supabase...");
        const { data, error } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', 'max_capacity') // Asegúrate de que 'max_capacity' coincida con la key de tu BD
            .single();

        if (error) throw error;

        if (data && data.value) {
            // Inyectamos el valor en todas las etiquetas que usen esta clase en el panel
            document.querySelectorAll('.max-capacity-display').forEach(el => {
                el.textContent = data.value;
            });
            console.log(`[Naiguatá Admin] Capacidad máxima sincronizada: ${data.value} personas.`);
        }
    } catch (err) {
        console.warn("[Naiguatá Admin Fallback] No se pudo procesar el límite de aforo remoto:", err);
    }
}

// Nombre consistente: initAdmin
async function initAdmin() {
    console.log("[Naiguatá Admin] Inicializando consola...");

    // 1. Asegurar conexión a Supabase y capturar el cliente
    const supabase = await getSupabaseClient();

    // Lógica para inicializar fecha si no existe (Fix para date=eq.null)
    const currentStore = adminStore.get();
    if (!currentStore.selectedDate) {
        const nextSaturday = getNextSaturday();
        adminStore.set({ ...currentStore, selectedDate: nextSaturday });
        console.log(`[Naiguatá Admin] Fecha inicial establecida automáticamente en: ${nextSaturday}`);
    }

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

    // NUEVO: Ejecuta la renderización del aforo máximo una vez autenticado
    await renderAdminCapacitySettings(supabase);

    // MODIFICACIÓN: Conectamos los botones de actualización remota con sus funciones en core.js
    document.getElementById('btn-update-bcv')?.addEventListener('click', () => handleUpdateBCV(supabase));
    document.getElementById('btn-update-price')?.addEventListener('click', () => handleUpdateTourPrice(supabase));
    document.getElementById('btn-update-capacity')?.addEventListener('click', () => handleUpdateMaxCapacity(supabase));
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

// (Mantén tu función showErrorBanner abajo intacta sin modificaciones)

function showErrorBanner(message) {
    // 1. Crear el contenedor del banner
    const banner = document.createElement('div');

    // 2. Estilizarlo directamente con JS (o puedes usar una clase CSS de tu proyecto)
    banner.style.position = 'fixed';
    banner.style.top = '20px';
    banner.style.right = '20px';
    banner.style.backgroundColor = '#ef4444'; // Rojo alerta
    banner.style.color = '#ffffff';
    banner.style.padding = '16px 24px';
    banner.style.borderRadius = '8px';
    banner.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    banner.style.zIndex = '9999';
    banner.style.fontFamily = 'sans-serif';
    banner.style.fontSize = '14px';

    // 3. Inyectar el texto del error
    banner.innerText = message;

    // 4. Añadirlo a la pantalla
    document.body.appendChild(banner);

    // 5. Hacer que desaparezca solo a los 5 segundos
    setTimeout(() => {
        banner.remove();
    }, 5000);
}