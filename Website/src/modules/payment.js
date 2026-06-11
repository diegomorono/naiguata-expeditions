/* ==========================================================================
   DOMINIO DE FACTURACIÓN - GESTOR DINÁMICO DE INSTRUCCIONES DE PAGO
   ========================================================================== */

export function initPaymentInstructions() {
    const selector = document.getElementById('payment-method');
    if (!selector) return;

    selector.addEventListener('change', () => {
        const selectedMethod = selector.value;

        // Ocultar preventivamente todos los bloques de cuentas bancarias
        document.querySelectorAll('.payment-instruction-block').forEach(block => {
            block.style.display = 'none';
        });

        // Revelar condicionalmente la cuenta destino seleccionada
        if (selectedMethod === 'pagomovil') {
            const nodePM = document.getElementById('instruction-pagomovil');
            if (nodePM) nodePM.style.display = 'block'; // Eliminado el segundo .style
        } else if (selectedMethod === 'binance') {
            const nodeBin = document.getElementById('instruction-binance');
            if (nodeBin) nodeBin.style.display = 'block';
        } else if (selectedMethod === 'efectivo') {
            const nodeEf = document.getElementById('instruction-efectivo');
            if (nodeEf) nodeEf.style.display = 'block';
        }
    });
}