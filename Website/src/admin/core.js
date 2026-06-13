/* ==========================================================================
   DOMINIO ADMINISTRATIVO - ORQUESTADOR CORE DE DATOS
   ========================================================================== */
import { getSupabaseClient } from '../config/supabase.js';
import { adminStore } from '../config/state.js';
// CORRECCIÓN: Importamos los módulos de renderizado para poder actualizar la interfaz
import { renderStats } from './finance.js';
import { renderRoster } from './roster.js';

export async function updateDashboardData() {
    try {
        const supabase = await getSupabaseClient();

        // Extraemos la fecha seleccionada de forma segura usando .get()
        const selectedDate = adminStore.get().selectedDate;

        // CORRECCIÓN: Cargamos en paralelo tanto 'registrations' como 'financials' filtrados por la fecha seleccionada
        const [registrationsResponse, financialsResponse] = await Promise.all([
            supabase
                .from('registrations')
                .select('*')
                .eq('date', selectedDate),
            supabase
                .from('financials') // Asegúrate de que este sea el nombre exacto de tu tabla de gastos/ingresos
                .select('*')
                .eq('date', selectedDate) // Si deseas que las finanzas se muestren globales y no por día, remueve esta línea
        ]);

        if (registrationsResponse.error) throw registrationsResponse.error;
        if (financialsResponse.error) throw financialsResponse.error;

        // Modificamos el estado administrativo de forma atómica e inmutable
        // CORRECCIÓN: Usamos el spread operador para no borrar 'selectedDate' u otras propiedades del store
        adminStore.set({
            ...adminStore.get(),
            registrations: registrationsResponse.data || [],
            financials: financialsResponse.data || []
        });

        // CORRECCIÓN: Invocamos de forma reactiva los renders con los datos nuevos del store
        renderRoster();
        renderStats();

        console.log("[Admin Core] Datos y vistas actualizados para:", selectedDate);
    } catch (err) {
        console.error("Error actualizando dashboard:", err);
    }
}

export function handleUpdateBCV(supabaseClient) {
    const newRate = prompt("Ingrese la nueva tasa oficial BCV:");
    if (!newRate || isNaN(newRate)) return;

    supabaseClient.from('system_settings')
        .update({ value: parseFloat(newRate) })
        .eq('key', 'last_valid_bcv')
        .then(({ error }) => {
            if (error) alert("Error al actualizar tasa: " + error.message);
            else alert("Tasa actualizada exitosamente.");
        });
}

export function handleUpdateTourPrice(supabaseClient) {
    const newPrice = prompt("Ingrese el nuevo precio base del tour ($ USD):");
    if (!newPrice || isNaN(newPrice)) return;

    supabaseClient.from('system_settings')
        .update({ value: parseFloat(newPrice).toString() })
        .eq('key', 'tour_base_price')
        .then(({ error }) => {
            if (error) alert("Error al actualizar el precio base: " + error.message);
            else alert("Precio base actualizado exitosamente en todo el sistema.");
        });
}

export function handleUpdateMaxCapacity(supabaseClient) {
    const newCapacity = prompt("Ingrese el nuevo límite estricto de capacidad:");
    if (!newCapacity || isNaN(newCapacity)) return;

    supabaseClient.from('system_settings')
        .update({ value: parseInt(newCapacity, 10).toString() })
        .eq('key', 'max_capacity') // <-- CORREGIDO: Ahora coincide con bcv.js
        .then(({ error }) => {
            if (error) alert("Error al actualizar la capacidad: " + error.message);
            else alert("Capacidad máxima del sistema actualizada con éxito.");
        });
}