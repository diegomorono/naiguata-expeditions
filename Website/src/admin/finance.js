import { getSupabaseClient } from '../config/supabase.js';
import { adminStore } from '../config/state.js';

export function renderStats() {
    // Calcula el total neto sumando los montos consumiendo el estado de forma inmutable con .get()
    const financials = adminStore.get().financials || [];
    const totalUSD = financials.reduce((acc, curr) => acc + (curr.total_neto_usd || curr.amount || 0), 0);
    document.getElementById('stat-total-usd').textContent = `$${totalUSD}`;
}

export function setupExpenseForm() {
    const expenseForm = document.getElementById('expense-form');
    if (!expenseForm) return;

    expenseForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // 1. Obtener la instancia del cliente de Supabase
        const supabase = await getSupabaseClient();

        // 2. Extraer los datos directamente de los inputs de tu formulario HTML
        const date = document.getElementById('expense-date')?.value;              // Formato 'YYYY-MM-DD'
        const concept = document.getElementById('expense-concept')?.value;        // Texto descriptivo
        const category = document.getElementById('expense-category')?.value;      // Debe coincidir con tus restricciones (ej: 'Catering/Alimentos')
        const account = document.getElementById('expense-account')?.value;        // 'Efectivo', 'Binance', 'Zelle' o 'Banco Bs'
        const currency = document.getElementById('expense-currency')?.value;      // 'USD' o 'VES'
        const amountOriginal = parseFloat(document.getElementById('expense-amount')?.value || 0);
        const exchangeRate = parseFloat(document.getElementById('expense-rate')?.value || 1);

        // El registration_id suele ser opcional (null) para gastos generales, o puedes capturarlo si el gasto se asocia a un cliente
        const registrationId = document.getElementById('expense-registration-id')?.value || null;

        // 3. Calcular automáticamente el total neto en USD si la moneda es Bolívares (VES)
        let totalNetoUsd = amountOriginal;
        if (currency === 'VES' && exchangeRate > 0) {
            totalNetoUsd = amountOriginal / exchangeRate;
        }

        try {
            // 4. Ejecutar el llamado seguro a través del RPC (Evita el bloqueo de la RLS)
            const { error } = await supabase.rpc('registrar_transaccion_segura', {
                p_registration_id: registrationId,
                p_date: date,
                p_type: 'Egreso', // Al ser un formulario de gastos, se guarda estrictamente como 'Egreso'
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

            // Opcional: Aquí puedes volver a llamar a las funciones que recarguen visualmente tus tablas/gráficos en el dashboard
            // await updateDashboardData(); 

        } catch (error) {
            console.error("Error al registrar la transacción financiera:", error);
            alert("No se pudo procesar el registro financiero. Revisa los datos o las restricciones de cuenta/categoría.");
        }
    });
}