import { adminState } from '../config/state.js';

export function renderRoster() {
    const container = document.getElementById('roster-container');
    container.innerHTML = adminState.registrations.map(r => `
        <div class="hiker-row ${r.medical_conditions ? 'has-alert' : ''}">
            <span>${r.name}</span>
            <span>${r.whatsapp}</span>
            <span>${r.status}</span>
        </div>
    `).join('');
}