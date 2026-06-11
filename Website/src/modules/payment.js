/* ==========================================================================
   DOMINIO DE FACTURACIÓN - GESTOR DINÁMICO DE INSTRUCCIONES DE PAGO
   ========================================================================== */

export function initPaymentInstructions() {
    const selector = document.getElementById('payment-method');
    if (!selector) return;

    selector.addEventListener('change', (e) => {
        updatePaymentInstructions(e.target.value);
    });
}

function updatePaymentInstructions(method) {
    // 1. Ocultar todos los bloques
    document.querySelectorAll('.payment-instruction-block').forEach(block => {
        block.style.display = 'none';
    });

    // 2. Revelar SOLO el bloque que coincide con el valor seleccionado
    // Esto es magia: si el value es 'pagomovil', busca el ID 'instruction-pagomovil'
    const targetBlock = document.getElementById(`instruction-${method}`);

    if (targetBlock) {
        targetBlock.style.display = 'block';
    } else {
        console.warn(`[Payment] No se encontró bloque de instrucciones para: ${method}`);
    }
}