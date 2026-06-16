import { getSupabaseClient } from '../config/supabase.js';
import { adminStore } from '../config/state.js';
import { updateDashboardData } from './core.js';

/**
 * RENDERIZADO DE MÉTRICAS FINANCIERAS
 * Calcula saldos por caja y rendimiento neto en USD.
 */
export function renderStats() {
    const transactions = adminStore.get().financials || [];
    const bcvRate = adminStore.get().bcvRate || 1;

    // 1. Inicialización de contadores
    let totalIncomeUsd = 0;
    let totalExpenseUsd = 0;

    const boxes = {
        'Efectivo': 0, // USD
        'Binance': 0,  // USD
        'Zelle': 0,    // USD
        'Banco Bs': 0  // VES
    };

    // 2. Procesamiento de transacciones
    transactions.forEach(t => {
        const amountUsd = parseFloat(t.total_neto_usd || 0);
        const amountOriginal = parseFloat(t.amount_original || 0);

        if (t.type === 'Ingreso') {
            totalIncomeUsd += amountUsd;
            if (t.account === 'Banco Bs') boxes[t.account] += amountOriginal;
            else boxes[t.account] += amountUsd;
        } else {
            totalExpenseUsd += amountUsd;
            if (t.account === 'Banco Bs') boxes[t.account] -= amountOriginal;
            else boxes[t.account] -= amountUsd;
        }
    });

    const netBenefitUsd = totalIncomeUsd - totalExpenseUsd;

    // 3. Actualización de UI: Dashboard Superior
    const elRevenue = document.getElementById('stat-revenue');
    const elRevenueVes = document.getElementById('stat-revenue-ves');

    if (elRevenue) elRevenue.textContent = `$${netBenefitUsd.toFixed(2)} USD`;
    if (elRevenueVes) elRevenueVes.textContent = `Bs. ${(netBenefitUsd * bcvRate).toFixed(2)} BCV`;

    // 4. Actualización de UI: Pestaña de Finanzas (Cajas)
    if (document.getElementById('box-cash-val')) document.getElementById('box-cash-val').textContent = `$${boxes['Efectivo'].toFixed(2)}`;
    if (document.getElementById('box-binance-val')) document.getElementById('box-binance-val').textContent = `$${boxes['Binance'].toFixed(2)}`;
    if (document.getElementById('box-zelle-val')) document.getElementById('box-zelle-val').textContent = `$${boxes['Zelle'].toFixed(2)}`;
    if (document.getElementById('box-banco-val')) document.getElementById('box-banco-val').textContent = `Bs. ${boxes['Banco Bs'].toFixed(2)}`;

    // 5. Split de Liquidación (Opcional: lógica de terceros)
    const elSplitNet = document.getElementById('split-income-net');
    const elSplitPayable = document.getElementById('split-accounts-payable');
    if (elSplitNet) elSplitNet.textContent = `$${totalIncomeUsd.toFixed(2)}`;
    // TODO: Implementar lógica de cuentas por pagar a terceros según inventory_stock consignment_qty
}

/**
 * CONFIGURACIÓN DEL FORMULARIO DE EGRESOS
 */
export function setupExpenseForm() {
    const form = document.getElementById('expense-register-form');
    if (!form) return;

    // Lógica reactiva para mostrar el campo de tasa solo si la cuenta es Banco Bs
    const accountSelect = document.getElementById('exp-account');
    const rateWrapper = document.getElementById('exp-rate-wrapper');
    const rateInput = document.getElementById('exp-rate');

    accountSelect?.addEventListener('change', (e) => {
        if (e.target.value === 'Banco Bs') {
            rateWrapper.style.display = 'block';
            rateInput.required = true;
            // Pre-poblar con la tasa del sistema
            rateInput.value = adminStore.get().bcvRate || "";
        } else {
            rateWrapper.style.display = 'none';
            rateInput.required = false;
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = form.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = "Registrando...";

        try {
            const supabase = await getSupabaseClient();
            const category = document.getElementById('exp-category').value;
            const account = document.getElementById('exp-account').value;
            const amountOriginal = parseFloat(document.getElementById('exp-amount').value);
            const exchangeRate = account === 'Banco Bs' ? parseFloat(rateInput.value) : 1;
            const description = document.getElementById('exp-desc').value;

            const currency = account === 'Banco Bs' ? 'VES' : 'USD';
            const totalNetoUsd = currency === 'VES' ? (amountOriginal / exchangeRate) : amountOriginal;

            const { error } = await supabase.from('financial_transactions').insert([{
                date: adminStore.get().selectedDate,
                type: 'Egreso',
                category: category,
                account: account,
                currency: currency,
                amount_original: amountOriginal,
                exchange_rate: exchangeRate,
                total_neto_usd: totalNetoUsd,
                concept: description
            }]);

            if (error) throw error;

            alert("✅ Gasto registrado con éxito.");
            form.reset();
            rateWrapper.style.display = 'none';
            updateDashboardData(supabase);

        } catch (err) {
            alert("❌ Error al registrar gasto: " + err.message);
        } finally {
            btn.disabled = false;
            btn.textContent = "Registrar Gasto";
        }
    });
}