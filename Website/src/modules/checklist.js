/* ==========================================================================
   DOMINIO DE EQUIPAMIENTO - PLANIFICADOR DINÁMICO
   ========================================================================== */
import { appStore } from '../config/state.js';

/**
 * Inicializa el módulo de checklist configurando sus observadores reactivos y listeners únicos.
 */
export function initGearChecklist() {
    const container = document.getElementById('checklist-container');

    // 1. Delegación de eventos (¡Se registra UNA SOLA VEZ aquí al inicializar!)
    if (container) {
        container.addEventListener('change', (e) => {
            if (e.target.classList.contains('gear-checkbox')) {
                const itemElement = e.target.closest('.gear-item');
                if (e.target.checked) {
                    itemElement?.classList.add('checked-item');
                } else {
                    itemElement?.classList.remove('checked-item');
                }
                updateChecklistProgress();
            }
        });
    }

    // 2. Escuchamos de manera reactiva el almacén global de datos
    appStore.subscribe(() => {
        console.log("[Checklist] Renderizando checklist dinámico...");
        renderGearChecklist();
    });
}

export function renderGearChecklist() {
    const container = document.getElementById('checklist-container');
    if (!container) return;

    // Renderizado basado en el estado (appStore.get().inventory)
    container.innerHTML = appStore.get().inventory.map(item => `
        <div class="gear-item">
            <input type="checkbox" class="gear-checkbox" id="gear-${item.id}">
            <label for="gear-${item.id}">${item.name}</label>
        </div>
    `).join('');

    // Ejecución inicial de la barra de progreso tras el renderizado
    updateChecklistProgress();
}

function updateChecklistProgress() {
    const totalItems = document.querySelectorAll('.gear-checkbox').length;
    const checkedItems = document.querySelectorAll('.gear-checkbox:checked').length;

    const pct = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

    const bar = document.getElementById('checklist-progress-bar');
    const label = document.getElementById('checklist-progress-text');

    if (bar) {
        bar.style.width = `${pct}%`;
        if (pct < 40) bar.style.backgroundColor = '#ef4444';
        else if (pct < 85) bar.style.backgroundColor = '#f59e0b';
        else bar.style.backgroundColor = '#10b981';
    }

    if (label) label.textContent = `${pct}% de tu equipo obligatorio listo`;
}