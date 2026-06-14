/* ==========================================================================
   DOMINIO DE FACTURACIÓN - GESTOR DINÁMICO DE INSTRUCCIONES DE PAGO
   ========================================================================== */

import { getSupabaseClient } from '../config/supabase.js';

let paymentInfoCache = null;

export function initPaymentInstructions() {
    const selector = document.getElementById('payment-method-select');
    if (!selector) return;

    selector.addEventListener('change', (e) => {
        updatePaymentInstructions(e.target.value);
    });
}

function updatePaymentInstructions(method) {
    const instructionsBox = document.getElementById('payment-instructions-box');
    if (!instructionsBox) return;

    if (!paymentInfoCache) {
        instructionsBox.style.display = 'block';
        instructionsBox.innerHTML = `<div style="padding: 15px; border-radius: 8px; background: rgba(255,255,255,0.05); color: #f4a261;">Cargando credenciales...</div>`;
        return;
    }

    const info = paymentInfoCache;
    let htmlContent = '';

    if (method === 'pagomovil') {
        htmlContent = `
            <div style="padding: 15px; border-radius: 8px; background: rgba(255,255,255,0.05); border-left: 4px solid #10b981;">
                <h4 style="margin-top: 0; color: #10b981; font-weight: 600;">📱 Pago Móvil</h4>
                <p style="margin: 5px 0;"><strong>Banco:</strong> ${info.pagomovil_banco}</p>
                <p style="margin: 5px 0;"><strong>Teléfono:</strong> ${info.pagomovil_telefono}</p>
                <p style="margin: 5px 0;"><strong>Cédula:</strong> ${info.pagomovil_cedula}</p>
                <p style="margin: 5px 0; font-size: 0.85em; color: #9ca3af;">Revisa el total en Bs al final del formulario y realiza el pago exacto al BCV.</p>
            </div>
        `;
    } else if (method === 'binance') {
        htmlContent = `
            <div style="padding: 15px; border-radius: 8px; background: rgba(255,255,255,0.05); border-left: 4px solid #fcd535;">
                <h4 style="margin-top: 0; color: #fcd535; font-weight: 600;">🔶 Binance Pay</h4>
                <p style="margin: 5px 0;"><strong>Cuenta / Pay ID:</strong> ${info.binance_email}</p>
                <p style="margin: 5px 0; font-size: 0.85em; color: #9ca3af;">Envía el monto total en USDT e ingresa tu Pay ID o correo como referencia.</p>
            </div>
        `;
    } else if (method === 'zelle') {
        htmlContent = `
            <div style="padding: 15px; border-radius: 8px; background: rgba(255,255,255,0.05); border-left: 4px solid #7c3aed;">
                <h4 style="margin-top: 0; color: #7c3aed; font-weight: 600;">🟣 Zelle</h4>
                <p style="margin: 5px 0;"><strong>Titular:</strong> ${info.zelle_titular}</p>
                <p style="margin: 5px 0;"><strong>Correo:</strong> ${info.zelle_correo}</p>
                <p style="margin: 5px 0; font-size: 0.85em; color: #9ca3af;">Escribe el nombre de quien hace el pago en el campo de referencia.</p>
            </div>
        `;
    } else if (method === 'efectivo') {
        htmlContent = `
            <div style="padding: 15px; border-radius: 8px; background: rgba(255,255,255,0.05); border-left: 4px solid #3b82f6;">
                <h4 style="margin-top: 0; color: #3b82f6; font-weight: 600;">💵 Efectivo</h4>
                <p style="margin: 5px 0; color: #f3f4f6;">Se recogerá el pago en divisa en perfecto estado durante el registro matutino en PGP La Julia.</p>
                <p style="margin: 5px 0; font-size: 0.85em; color: #9ca3af;">Por favor, ingresa tu número de cédula en el campo de referencia.</p>
            </div>
        `;
    }

    instructionsBox.style.display = 'block';
    instructionsBox.innerHTML = htmlContent;
}

export async function loadPaymentData() {
    try {
        console.log("[Payment] Solicitando credenciales financieras desde Supabase...");
        const supabase = await getSupabaseClient();
        
        const { data, error } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', 'payment_info')
            .single();

        if (error) throw error;

        if (data && data.value) {
            paymentInfoCache = data.value;
            console.log("[Payment] Credenciales cargadas exitosamente.");
            
            // Si el usuario ya había seleccionado un método antes de cargar, actualizamos
            const selector = document.getElementById('payment-method-select');
            if (selector && selector.value) {
                updatePaymentInstructions(selector.value);
            }
        }
    } catch (err) {
        console.error("[Payment] Error al obtener la configuración de pagos:", err);
    }
}