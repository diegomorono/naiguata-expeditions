/* ==========================================================================
   DOMINIO ADMINISTRATIVO — ORQUESTADOR CORE DE DATOS
   ========================================================================== */
import { adminStore } from '../config/state.js';
import { renderStats } from './finance.js';
import { renderRoster } from './roster.js';
import { renderLogistics } from './logistics.js';
import { renderChecklist } from './checklist.js';

/**
 * Obtiene todas las fechas únicas que tienen registros en la BD.
 * Retorna array ordenado ascendente de strings 'YYYY-MM-DD'.
 */
export async function getExpeditionDates(supabase) {
    try {
        const { data, error } = await supabase
            .from('registrations')
            .select('date')
            .order('date', { ascending: true });

        if (error) throw error;
        return [...new Set((data || []).map(d => d.date))];
    } catch (e) {
        console.error('[Core] Error obteniendo fechas:', e.message);
        return [];
    }
}

/**
 * Renderiza el carrusel de expediciones.
 * Acepta `dates` como parámetro para evitar una query extra cuando
 * ya se obtuvieron antes (ej. al filtrar por rango).
 */
export function renderExpeditionCarousel(dates) {
    const container = document.getElementById('expeditions-carousel-container');
    if (!container) return;

    const selectedDate = adminStore.get().selectedDate;

    if (!dates.length) {
        container.innerHTML = `<p style="opacity:0.5;font-size:0.8rem;padding:10px;">No hay expediciones en este rango.</p>`;
        return;
    }

    container.innerHTML = dates.map(date => {
        const isActive = date === selectedDate;
        const d = new Date(date + 'T12:00:00');
        const dayNum = d.getDate();
        const monthStr = d.toLocaleDateString('es-VE', { month: 'short' }).toUpperCase();
        const year = d.getFullYear();

        return `
            <div class="expedition-card${isActive ? ' active' : ''}"
                 data-date="${date}"
                 style="min-width:100px;padding:15px;border-radius:12px;
                        background:${isActive ? 'var(--primary-glow,rgba(16,185,129,0.15))' : 'rgba(255,255,255,0.02)'};
                        border:1px solid ${isActive ? 'var(--primary,#10b981)' : 'rgba(255,255,255,0.1)'};
                        cursor:pointer;text-align:center;transition:all 0.2s;user-select:none;">
                <div style="font-size:0.7rem;opacity:0.6;margin-bottom:5px;">${monthStr}</div>
                <div style="font-size:1.5rem;font-weight:800;font-family:'Outfit',sans-serif;
                            color:${isActive ? 'var(--primary,#10b981)' : '#fff'};">${dayNum}</div>
                <div style="font-size:0.6rem;margin-top:5px;opacity:0.5;">${year}</div>
            </div>
        `;
    }).join('');
}

/**
 * Carga datos del dashboard para la fecha activa del store.
 * Recibe el cliente supabase con service_role para bypass de RLS.
 */
export async function updateDashboardData(supabase) {
    try {
        const selectedDate = adminStore.get().selectedDate;
        console.log('[Admin Core] Cargando datos para fecha:', selectedDate);

        const [regRes, finRes] = await Promise.all([
            supabase.from('registrations').select('*').eq('date', selectedDate),
            supabase.from('financial_transactions').select('*').eq('date', selectedDate)
        ]);

        if (regRes.error) throw regRes.error;

        adminStore.set({
            ...adminStore.get(),
            registrations: regRes.data || [],
            financials: finRes.data || []
        });

        renderRoster();
        renderStats();
        renderLogistics();
        renderChecklist();

    } catch (err) {
        console.error('[Admin Core] Error actualizando dashboard:', err);
    }
}

/**
 * Registra la delegación de clics del carrusel UNA sola vez.
 * Cuando el usuario hace clic en una tarjeta, actualiza el store,
 * re-renderiza el carrusel (para el estado activo) y carga los datos.
 */
export function initCarouselDelegation(supabase, getAllDates) {
    const container = document.getElementById('expeditions-carousel-container');
    if (!container) return;

    container.addEventListener('click', async e => {
        const card = e.target.closest('.expedition-card');
        if (!card?.dataset.date) return;

        adminStore.set({ ...adminStore.get(), selectedDate: card.dataset.date });

        // Re-renderizar carrusel para reflejar la nueva selección activa
        const dates = await getAllDates();
        renderExpeditionCarousel(dates);

        await updateDashboardData(supabase);
    });
}

/**
 * Conecta los inputs de filtro por rango de fechas y el botón de reset.
 * Filtra las tarjetas del carrusel sin hacer query extra —
 * trabaja sobre el array completo de fechas ya en memoria.
 */
export function initDateRangeFilter(getAllDates) {
    const inputStart = document.getElementById('filter-start-date');
    const inputEnd = document.getElementById('filter-end-date');
    const btnClear = document.getElementById('btn-clear-date-filter');

    if (!inputStart || !inputEnd) return;

    const applyFilter = async () => {
        const allDates = await getAllDates();
        const start = inputStart.value;  // 'YYYY-MM-DD' o ''
        const end = inputEnd.value;    // 'YYYY-MM-DD' o ''

        const filtered = allDates.filter(date => {
            if (start && date < start) return false;
            if (end && date > end) return false;
            return true;
        });

        renderExpeditionCarousel(filtered);
    };

    inputStart.addEventListener('change', applyFilter);
    inputEnd.addEventListener('change', applyFilter);

    if (btnClear) {
        btnClear.addEventListener('click', async () => {
            inputStart.value = '';
            inputEnd.value = '';
            const allDates = await getAllDates();
            renderExpeditionCarousel(allDates);
        });
    }
}

export function handleUpdateBCV(supabaseClient) {
    const bcvInput = document.querySelector('#admin-bcv-rate');
    if (!bcvInput) { console.error('No se encontró #admin-bcv-rate'); return; }
    const newRate = bcvInput.value.trim();
    if (!newRate || isNaN(newRate)) { alert('Por favor, ingrese una tasa BCV válida.'); return; }
    supabaseClient.from('system_settings')
        .update({ value: parseFloat(newRate) })
        .eq('key', 'last_valid_bcv')
        .then(({ error }) => {
            if (error) alert('Error al actualizar tasa: ' + error.message);
            else alert('Tasa actualizada exitosamente.');
        });
}

export function handleUpdateTourPrice(supabaseClient) {
    const priceInput = document.querySelector('#admin-tour-price');
    if (!priceInput) { console.error('No se encontró #admin-tour-price'); return; }
    const newPrice = priceInput.value.trim();
    if (!newPrice || isNaN(newPrice)) { alert('Por favor, ingrese un precio base válido.'); return; }
    supabaseClient.from('system_settings')
        .update({ value: parseFloat(newPrice).toString() })
        .eq('key', 'tour_base_price')
        .then(({ error }) => {
            if (error) alert('Error al actualizar precio: ' + error.message);
            else alert('Precio base actualizado exitosamente.');
        });
}

export function handleUpdateMaxCapacity(supabaseClient) {
    const capacityInput = document.querySelector('#admin-max-capacity');
    if (!capacityInput) { console.error('No se encontró #admin-max-capacity'); return; }
    const newCapacity = capacityInput.value.trim();
    if (!newCapacity || isNaN(newCapacity)) { alert('Por favor, ingrese un límite de capacidad numérico.'); return; }
    supabaseClient.from('system_settings')
        .update({ value: parseInt(newCapacity, 10).toString() })
        .eq('key', 'max_capacity')
        .then(({ error }) => {
            if (error) alert('Error al actualizar capacidad: ' + error.message);
            else alert('Capacidad máxima actualizada con éxito.');
        });
}