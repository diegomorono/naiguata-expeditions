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

    container.innerHTML = inventory.map(item => `
        <li style="display: flex; align-items: center; gap: 15px; padding: 12px; border-radius: 8px; background: rgba(255,255,255,0.03); margin-bottom: 8px;">
            <input type="checkbox" class="gear-checkbox" id="gear-${item.item_id}" style="width: 22px; height: 22px; accent-color: #10b981; cursor: pointer;">
            <div class="gear-text" style="flex: 1;">
                <label for="gear-${item.item_id}" style="cursor: pointer; display: block; font-weight: 600; color: #f3f4f6;">${item.item_name}</label>
                ${item.price_usd && item.price_usd > 0
            ? `<span style="font-size: 0.85rem; color: #9ca3af;">Si no lo tienes, alquílalo por $${item.price_usd}</span>`
            : `<span style="font-size: 0.85rem; color: #f4a261; font-style: italic;">Indispensable – Traer obligatoriamente</span>`
        }
            </div>
        </li>
    `).join('');

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