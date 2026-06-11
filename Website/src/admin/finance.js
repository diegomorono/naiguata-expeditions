import { adminState } from '../config/state.js';

export function renderStats() {
    const totalUSD = adminState.financials.reduce((acc, curr) => acc + curr.amount, 0);
    document.getElementById('stat-total-usd').textContent = `$${totalUSD}`;
}

export function setupExpenseForm() {
    document.getElementById('expense-form').addEventListener('submit', (e) => {
        // Lógica de registro de egresos
    });
}