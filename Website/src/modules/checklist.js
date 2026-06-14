/* ==========================================================================
   DOMINIO DE EQUIPAMIENTO - PLANIFICADOR DINÁMICO
   ========================================================================== */
import { appStore } from '../config/state.js';

export function initGearChecklist() {
    const container = document.getElementById('interactive-gear-list');

    if (container) {
        container.addEventListener('change', (e) => {
            if (e.target.classList.contains('gear-checkbox')) {
                updateChecklistProgress();
            }
        });
    }

    appStore.subscribe(() => {
        renderGearChecklist();
    });
}

export function renderGearChecklist() {
    const container = document.getElementById('interactive-gear-list');
    if (!container) return;

    const inventory = appStore.get().inventory;
    if (!inventory || inventory.length === 0) return;

    container.innerHTML = inventory.map(item => {
        // Separamos el nombre del artículo y el peso de forma dinámica
        const parts = item.item_name.split(' - ');
        const itemNameOnly = parts[0];
        const itemWeightOnly = parts[1] || '';

        return `
            <li style="display: flex; align-items: center; justify-content: space-between; padding: 6px 10px; border-radius: 6px; background: rgba(255,255,255,0.02); margin-bottom: 5px; gap: 12px;">
                <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
                    <input type="checkbox" class="gear-checkbox" id="gear-${item.item_id}" style="width: 14px; height: 14px; accent-color: #10b981; cursor: pointer; flex-shrink: 0;">
                    <label for="gear-${item.item_id}" style="cursor: pointer; font-weight: 500; color: #d1d5db; font-size: 0.88rem; line-height: 1.2; user-select: none;">${itemNameOnly}</label>
                </div>
                ${itemWeightOnly ? `<span style="font-size: 0.82rem; color: #8892b0; font-weight: 400; flex-shrink: 0; white-space: nowrap;">${itemWeightOnly}</span>` : ''}
            </li>
        `;
    }).join('');

    updateChecklistProgress();
}

function updateChecklistProgress() {
    const totalItems = document.querySelectorAll('.gear-checkbox').length;
    const checkedItems = document.querySelectorAll('.gear-checkbox:checked').length;

    const pct = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

    const bar = document.getElementById('prep-bar');
    const pctLabel = document.getElementById('prep-percentage');
    const warning = document.getElementById('checklist-warning');

    if (bar) {
        bar.style.width = `${pct}%`;
        if (pct < 40) bar.style.backgroundColor = '#ef4444';
        else if (pct < 85) bar.style.backgroundColor = '#f59e0b';
        else bar.style.backgroundColor = '#10b981';
    }

    if (pctLabel) {
        pctLabel.textContent = `${pct}%`;
        pctLabel.style.color = pct === 100 ? '#10b981' : '#f4a261';
    }

    if (warning) {
        if (pct < 100 && totalItems > 0) {
            warning.classList.remove('hidden');
        } else {
            warning.classList.add('hidden');
        }
    }
}