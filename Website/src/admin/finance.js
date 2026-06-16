import { getSupabaseClient } from '../config/supabase.js';
import { adminStore } from '../config/state.js';
import { DOM_IDS } from '../config/dom-id.js';

export function renderStats() {
    // Calcula el total neto sumando los montos consumiendo el estado de forma inmutable con .get()
    const financials = adminStore.get().financials || [];
    const totalUSD = financials.reduce((acc, curr) => acc + (curr.total_neto_usd || curr.amount || 0), 0);
    document.getElementById(DOM_IDS.finance.statTotalUsd).textContent = `$${totalUSD}`;
}

export function setupExpenseForm() {
    const expenseForm = document.getElementById(DOM_IDS.finance.expenseForm);
    if (!expenseForm) return;

    expenseForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // 1. Obtener la instancia del cliente de Supabase
        const supabase = await getSupabaseClient();

        // 2. Extraer los datos directamente de los inputs usando el contrato de IDs
        const date = document.getElementById(DOM_IDS.finance.expenseDate)?.value;
        const concept = document.getElementById(DOM_IDS.finance.expenseConcept)?.value;
        const category = document.getElementById(DOM_IDS.finance.expenseCategory)?.value;
        const account = document.getElementById(DOM_IDS.finance.expenseAccount)?.value;
        const currency = document.getElementById(DOM_IDS.finance.expenseCurrency)?.value;
        const amountOriginal = parseFloat(document.getElementById(DOM_IDS.finance.expenseAmount)?.value || 0);
        const exchangeRate = parseFloat(document.getElementById(DOM_IDS.finance.expenseRate)?.value || 1);

        const registrationId = document.getElementById(DOM_IDS.finance.expenseRegistrationId)?.value || null;

        // 3. Calcular automáticamente el total neto en USD si la moneda es Bolívares (VES)
        let totalNetoUsd = amountOriginal;
        if (currency === 'VES' && exchangeRate > 0) {
            totalNetoUsd = amountOriginal / exchangeRate;
        }

        try {
            // 4. Ejecutar el llamado seguro a través del RPC
            const { error } = await supabase.rpc('registrar_transaccion_segura', {
                p_registration_id: registrationId,
                p_date: date,
                p_type: 'Egreso',
                p_concept: concept,
                p_category: category,
                p_account: account,
                p_currency: currency,
                p_amount_original: amountOriginal,
                p_exchange_rate: exchangeRate,
                p_total_neto_usd: totalNetoUsd
            });

            if (error) throw error;

            alert("¡Gasto registrado exitosamente de forma segura!");
            expenseForm.reset();

        } catch (error) {
            console.error("Error al registrar la transacción financiera:", error);
            alert("No se pudo procesar el registro financiero. Revisa los datos o las restricciones de cuenta/categoría.");
        }
    });
}