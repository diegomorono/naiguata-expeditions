/* ==========================================================================
   DOMINIO ADMINISTRATIVO — ORQUESTADOR CORE DE DATOS
   ========================================================================== */
import { getSupabaseClient } from '../config/supabase.js';
import { adminStore } from '../config/state.js';
import { renderStats } from './finance.js';
import { renderRoster } from './roster.js';
import { renderLogistics } from './logistics.js';
import { renderChecklist } from './checklist.js';

export async function updateDashboardData(supabaseClient) {
    try {
        const supabase = supabaseClient;
        const selectedDate = adminStore.get().selectedDate;

        console.log('[Admin Core] Cargando datos para fecha:', selectedDate);

        const [registrationsResponse, financialsResponse] = await Promise.all([
            supabase.from('registrations').select('*').eq('date', selectedDate),
            supabase.from('financial_transactions').select('*').eq('date', selectedDate)
        ]);

        if (registrationsResponse.error) throw registrationsResponse.error;

        adminStore.set({
            ...adminStore.get(),
            registrations: registrationsResponse.data || [],
            financials: financialsResponse.data || []
        });

        renderRoster();
        renderStats();
        renderLogistics();
        renderChecklist();
        renderExpeditionCarousel(supabase);

    } catch (err) {
        console.error('[Admin Core] Error actualizando dashboard:', err);
    }
}

/**
 * Renderiza el carrusel de expediciones.
 * La navegación entre fechas usa delegación sobre el contenedor estable,
 * eliminando el patrón window.switchAdminDate que contaminaba el scope global.
 */
export async function renderExpeditionCarousel(supabase) {
    const container = document.getElementById('expeditions-carousel-container');
    if (!container) return;

    try {
        const { data, error } = await supabase
            .from('registrations')
            .select('date')
            .order('date', { ascending: true });

        if (error) throw error;

        const uniqueDates = [...new Set((data || []).map(d => d.date))];
        const selectedDate = adminStore.get().selectedDate;

        if (uniqueDates.length === 0) {
            container.innerHTML = `<p style="opacity:0.5;font-size:0.8rem;padding:10px;">No hay expediciones registradas aún.</p>`;
            return;
        }

        container.innerHTML = uniqueDates.map(date => {
            const isActive = date === selectedDate;
            const d = new Date(date + 'T12:00:00');
            const dayNum = d.getDate();
            const monthStr = d.toLocaleDateString('es-VE', { month: 'short' }).toUpperCase();

            return `
                <div class="expedition-card${isActive ? ' active' : ''}"
                     data-date="${date}"
                     style="min-width:100px;padding:15px;border-radius:12px;
                            background:${isActive ? 'var(--primary-glow)' : 'rgba(255,255,255,0.02)'};
                            border:1px solid ${isActive ? 'var(--primary)' : 'rgba(255,255,255,0.1)'};
                            cursor:pointer;text-align:center;transition:all 0.2s;">
                    <div style="font-size:0.7rem;opacity:0.6;margin-bottom:5px;">${monthStr}</div>
                    <div style="font-size:1.5rem;font-weight:800;font-family:'Outfit';">${dayNum}</div>
                    <div style="font-size:0.6rem;margin-top:5px;">${d.getFullYear()}</div>
                </div>
            `;
        }).join('');

    } catch (e) {
        console.error('[Carrusel] Error:', e);
    }
}

/**
 * Registra la delegación de clics del carrusel UNA sola vez.
 * Se llama desde admin-main.js al inicializar el panel.
 */
export function initCarouselDelegation(supabase) {
    const container = document.getElementById('expeditions-carousel-container');
    if (!container) return;

    container.addEventListener('click', e => {
        const card = e.target.closest('.expedition-card');
        if (!card?.dataset.date) return;

        const newDate = card.dataset.date;
        adminStore.set({ ...adminStore.get(), selectedDate: newDate });
        updateDashboardData(supabase);
    });
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