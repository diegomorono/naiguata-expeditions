/* ==========================================================================
   DOMINIO ADMINISTRATIVO - ORQUESTADOR CORE DE DATOS
   ========================================================================== */
import { getSupabaseClient } from '../config/supabase.js';
import { adminStore } from '../config/state.js';

export async function updateDashboardData() {
    try {
        const supabase = await getSupabaseClient();

        // Extraemos la fecha seleccionada de forma segura usando .get()
        const selectedDate = adminStore.get().selectedDate;

        const { data, error } = await supabase
            .from('registrations')
            .select('*')
            .eq('date', selectedDate);

        if (error) throw error;

        // Modificamos el estado administrativo de forma atómica e inmutable
        adminStore.set({
            registrations: data
        });

        // Aquí llamarías a renderRoster() y renderStats() de los otros módulos
        console.log("[Admin Core] Datos actualizados para:", selectedDate);
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