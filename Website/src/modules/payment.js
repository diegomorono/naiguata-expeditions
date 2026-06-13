/* ==========================================================================
   DOMINIO DE FACTURACIÓN - GESTOR DINÁMICO DE INSTRUCCIONES DE PAGO
   ========================================================================== */

import { getSupabaseClient } from '../config/supabase.js';

/**
 * Inicializa el escuchador de eventos para el selector de métodos de pago
 */
export function initPaymentInstructions() {
    const selector = document.getElementById('payment-method-select');
    if (!selector) return;

    selector.addEventListener('change', (e) => {
        updatePaymentInstructions(e.target.value);
    });
}

/**
 * Controla la visibilidad de los bloques informativos de pago en la UI
 */
function updatePaymentInstructions(method) {
    const instructionsBox = document.getElementById('payment-instructions-box');
    if (!instructionsBox) return;

    // 1. Revelar el contenedor principal de instrucciones
    instructionsBox.style.display = 'block';

    // 2. Ocultar todos los sub-bloques internos utilizando la nueva clase
    document.querySelectorAll('.payment-method-info').forEach(block => {
        block.style.display = 'none';
    });

    // 3. Revelar SOLO el sub-bloque que coincide con la opción seleccionada (info-pagomovil, info-binance, etc.)
    const targetBlock = document.getElementById(`info-${method}`);

    if (targetBlock) {
        targetBlock.style.display = 'block';
    } else {
        console.warn(`[Payment] No se encontró bloque de instrucciones para: ${method}`);
    }
}

/**
 * Consulta de forma segura las credenciales desde la tabla system_settings de Supabase
 * e inyecta dinámicamente los valores en los contenedores del HTML
 */
export async function loadPaymentData() {
    try {
        console.log("[Payment] Solicitando credenciales financieras desde Supabase...");
        const supabase = await getSupabaseClient();
        
        // Consultamos la fila única bajo la clave 'payment_info'
        const { data, error } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', 'payment_info')
            .single();

        if (error) {
            console.error("[Payment] Error al obtener la configuración de pagos desde Supabase:", error);
            return;
        }

        if (data && data.value) {
            const info = data.value;
            
            // Inyección segura de las propiedades del JSONB utilizando los IDs exactos del HTML
            if (document.getElementById('pm-banco')) document.getElementById('pm-banco').textContent = info.pagomovil_banco || 'No disponible';
            if (document.getElementById('pm-telefono')) document.getElementById('pm-telefono').textContent = info.pagomovil_telefono || 'No disponible';
            if (document.getElementById('pm-cedula')) document.getElementById('pm-cedula').textContent = info.pagomovil_cedula || 'No disponible';
            if (document.getElementById('binance-account')) document.getElementById('binance-account').textContent = info.binance_email || 'No disponible';
            if (document.getElementById('zelle-titular')) document.getElementById('zelle-titular').textContent = info.zelle_titular || 'No disponible';
            if (document.getElementById('zelle-account')) document.getElementById('zelle-account').textContent = info.zelle_correo || 'No disponible';
            
            console.log("[Payment] Credenciales financieras inyectadas de forma dinámica correctamente.");
        }
    } catch (err) {
        console.error("[Payment] Error crítico durante la carga de configuraciones de pago:", err);
    }
}