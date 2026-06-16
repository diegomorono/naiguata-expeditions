/* ==========================================================================
   DOMINIO ADMINISTRATIVO - ORQUESTADOR CORE DE DATOS
   ========================================================================== */
import { getSupabaseClient } from '../config/supabase.js';
import { adminStore } from '../config/state.js';
// CORRECCIÓN: Importamos los módulos de renderizado para poder actualizar la interfaz
import { renderStats } from './finance.js';
import { renderRoster } from './roster.js';
import { renderLogistics } from './logistics.js';
import { renderChecklist } from './checklist.js';

export async function updateDashboardData(supabaseClient) {
    try {
        const supabase = supabaseClient;
        const selectedDate = adminStore.get().selectedDate;

        console.log("[Admin Core] Cargando datos para fecha:", selectedDate);

        // CARGA EN PARALELO
        const [registrationsResponse, financialsResponse] = await Promise.all([
            supabase
                .from('registrations')
                .select('*')
                .eq('date', selectedDate),
            supabase
                .from('financial_transactions') 
                .select('*')
                .eq('date', selectedDate) 
        ]);

        if (registrationsResponse.error) throw registrationsResponse.error;

        // Modificamos el estado
        adminStore.set({
            ...adminStore.get(),
            registrations: registrationsResponse.data || [],
            financials: financialsResponse.data || []
        });

        // Renders
        renderRoster();
        renderStats();
        renderLogistics();
        renderChecklist();
        
        // También actualizamos el carrusel para reflejar la selección
        renderExpeditionCarousel(supabase);

    } catch (err) {
        console.error("Error actualizando dashboard:", err);
    }
}

/**
 * CARRUSEL DE PRÓXIMAS SALIDAS
 * Busca todas las fechas con registros para permitir navegación.
 */
export async function renderExpeditionCarousel(supabase) {
    const container = document.getElementById('expeditions-carousel-container');
    if (!container) return;

    try {
        // Obtenemos fechas únicas de la tabla de registros
        const { data, error } = await supabase
            .from('registrations')
            .select('date')
            .order('date', { ascending: true });

        if (error) throw error;

        // Extraer fechas únicas
        const uniqueDates = [...new Set(data.map(d => d.date))];
        const selectedDate = adminStore.get().selectedDate;

        if (uniqueDates.length === 0) {
            container.innerHTML = `<p style="opacity: 0.5; font-size: 0.8rem;">No hay expediciones registradas aún.</p>`;
            return;
        }

        container.innerHTML = uniqueDates.map(date => {
            const isActive = date === selectedDate;
            const d = new Date(date + "T12:00:00");
            const dayNum = d.getDate();
            const monthStr = d.toLocaleDateString('es-VE', { month: 'short' }).toUpperCase();
            
            return `
                <div class="expedition-card ${isActive ? 'active' : ''}" 
                     style="min-width: 100px; padding: 15px; border-radius: 12px; background: ${isActive ? 'var(--primary-glow)' : 'rgba(255,255,255,0.02)'}; 
                            border: 1px solid ${isActive ? 'var(--primary)' : 'rgba(255,255,255,0.1)'}; 
                            cursor: pointer; text-align: center; transition: all 0.2s;"
                     onclick="window.switchAdminDate('${date}')">
                    <div style="font-size: 0.7rem; opacity: 0.6; margin-bottom: 5px;">${monthStr}</div>
                    <div style="font-size: 1.5rem; font-weight: 800; font-family: 'Outfit';">${dayNum}</div>
                    <div style="font-size: 0.6rem; margin-top: 5px;">${d.getFullYear()}</div>
                </div>
            `;
        }).join('');

        // Exponer la función globalmente para los clics
        window.switchAdminDate = (newDate) => {
            adminStore.set({ ...adminStore.get(), selectedDate: newDate });
            updateDashboardData(supabase);
        };

    } catch (e) {
        console.error("Error en carrusel:", e);
    }
}

export function handleUpdateBCV(supabaseClient) {
    // CORRECCIÓN: Seleccionamos el input premium ya estructurado en el HTML
    const bcvInput = document.querySelector('#admin-bcv-rate');

    if (!bcvInput) {
        console.error("Error: No se encontró el input #admin-bcv-rate en el DOM.");
        return;
    }

    const newRate = bcvInput.value.trim();
    if (!newRate || isNaN(newRate)) {
        alert("Por favor, ingrese una tasa BCV válida en el panel administrativo.");
        return;
    }

    supabaseClient.from('system_settings')
        .update({ value: parseFloat(newRate) })
        .eq('key', 'last_valid_bcv')
        .then(({ error }) => {
            if (error) alert("Error al actualizar tasa: " + error.message);
            else alert("Tasa actualizada exitosamente.");
        });
}

export function handleUpdateTourPrice(supabaseClient) {
    // CORRECCIÓN: Aplicamos la misma lógica para evitar prompt() en el precio base
    const priceInput = document.querySelector('#admin-tour-price');

    if (!priceInput) {
        console.error("Error: No se encontró el input #admin-tour-price en el DOM.");
        return;
    }

    const newPrice = priceInput.value.trim();
    if (!newPrice || isNaN(newPrice)) {
        alert("Por favor, ingrese un precio base válido en el panel.");
        return;
    }

    supabaseClient.from('system_settings')
        .update({ value: parseFloat(newPrice).toString() })
        .eq('key', 'tour_base_price')
        .then(({ error }) => {
            if (error) alert("Error al actualizar el precio base: " + error.message);
            else alert("Precio base actualizado exitosamente en todo el sistema.");
        });
}

export function handleUpdateMaxCapacity(supabaseClient) {
    // CORRECCIÓN: Aplicamos la misma lógica para evitar prompt() en la capacidad máxima
    const capacityInput = document.querySelector('#admin-max-capacity');

    if (!capacityInput) {
        console.error("Error: No se encontró el input #admin-max-capacity en el DOM.");
        return;
    }

    const newCapacity = capacityInput.value.trim();
    if (!newCapacity || isNaN(newCapacity)) {
        alert("Por favor, ingrese un límite estricto de capacidad numérico.");
        return;
    }

    supabaseClient.from('system_settings')
        .update({ value: parseInt(newCapacity, 10).toString() })
        .eq('key', 'max_capacity')
        .then(({ error }) => {
            if (error) alert("Error al actualizar la capacidad: " + error.message);
            else alert("Capacidad máxima del sistema actualizada con éxito.");
        });
}