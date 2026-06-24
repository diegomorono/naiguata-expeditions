import { adminStore } from '../config/state.js';
import { getSupabaseClient } from '../config/supabase.js';
import { updateDashboardData } from './core.js';

/* ── Escapa HTML para evitar XSS al inyectar datos de la BD en el DOM ── */
function sanitize(str) {
    if (!str) return '';
    return String(str).replace(/[<>"'`]/g, c => (
        { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '`': '&#x60;' }[c]
    ));
}

export function renderRoster() {
    const container = document.getElementById('roster-table-body');
    if (!container) return;

    container.innerHTML = '';
    const registrations = adminStore.get().registrations || [];

    if (registrations.length === 0) {
        container.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:30px;opacity:0.5;">No hay participantes registrados para esta fecha.</td></tr>`;
        return;
    }

    registrations.forEach(reg => {
        const tr = document.createElement('tr');

        const hasAlert = reg.medical && reg.medical !== 'Ninguna.' && reg.medical.trim() !== '';
        if (hasAlert) {
            tr.style.background = 'rgba(239,68,68,0.05)';
            tr.style.borderLeft = '3px solid #ef4444';
        }

        const rentalsText = reg.rentals && typeof reg.rentals === 'object'
            ? Object.entries(reg.rentals).filter(([, v]) => v > 0).map(([k, v]) => `${k} (x${v})`).join(', ') || 'Ninguno'
            : 'Ninguno';

        const statusBadge = getStatusBadge(reg.status);
        const healthIcon = hasAlert ? '🔴' : '🟢';
        const isPending = reg.status && reg.status.includes('Pendiente');

        tr.innerHTML = `
            <td style="padding:12px 10px;">
                <div style="font-weight:600;">${sanitize(reg.name)}</div>
                <div style="font-size:0.75rem;opacity:0.6;">C.I: ${sanitize(reg.reference_number || 'N/A')}</div>
            </td>
            <td style="padding:12px 10px;">
                <a href="https://wa.me/${(reg.whatsapp || '').replace(/[^0-9]/g, '')}" target="_blank" class="roster-whatsapp-link">
                    ${sanitize(reg.whatsapp)}
                </a>
            </td>
            <td style="padding:12px 10px;">
                <span class="badge" style="margin:0;background:rgba(255,255,255,0.05);color:#fff;">${sanitize(reg.group_code)}</span>
            </td>
            <td style="padding:12px 10px;text-align:center;">${sanitize(reg.gender)}</td>
            <td style="padding:12px 10px;">
                <div style="font-size:0.8rem;">${sanitize(reg.tent_preference)}</div>
                <div style="font-size:0.7rem;color:var(--secondary);">Eq: ${sanitize(rentalsText)}</div>
            </td>
            <td style="padding:12px 10px;">
                <div title="${sanitize(reg.medical || 'Sin observaciones')}">
                    ${healthIcon} ${sanitize((reg.medical || 'Ninguna').slice(0, 40))}${(reg.medical || '').length > 40 ? '…' : ''}
                </div>
            </td>
            <td style="padding:12px 10px;">
                <div>${statusBadge}</div>
                <div style="font-weight:700;color:var(--primary);margin-top:4px;">$${parseFloat(reg.total_usd || 0).toFixed(2)}</div>
            </td>
            <td style="padding:12px 10px;text-align:center;">
                <div style="display:flex;gap:5px;justify-content:center;">
                    ${isPending ? `<button class="btn-primary btn-small btn-audit" data-id="${sanitize(reg.id)}">Validar</button>` : ''}
                    <button class="btn-secondary btn-small btn-delete" data-id="${sanitize(reg.id)}">🗑️</button>
                </div>
            </td>
        `;

        container.appendChild(tr);
    });

    // Delegación registrada una sola vez sobre el contenedor estable de la tabla.
    // setupRosterListeners() ya no se llama aquí — se inicializa en initRosterDelegation().
}

function getStatusBadge(status) {
    if (!status) return `<span class="badge" style="margin:0;font-size:0.65rem;background:#444;color:#ccc;">SIN ESTADO</span>`;
    if (status.includes('Confirmado')) return `<span class="badge badge-green" style="margin:0;font-size:0.65rem;">🟢 CONFIRMADO</span>`;
    if (status.includes('Cancelado')) return `<span class="badge badge-red"   style="margin:0;font-size:0.65rem;">🔴 CANCELADO</span>`;
    return `<span class="badge badge-orange" style="margin:0;font-size:0.65rem;">🟡 PENDIENTE</span>`;
}

/**
 * Registra la delegación de eventos sobre #roster-table UNA sola vez al iniciar el panel.
 * Los clics en botones dinámicos (.btn-audit, .btn-delete) funcionan aunque el tbody
 * se re-renderice completamente al cambiar de fecha.
 */
export function initRosterDelegation() {
    const table = document.getElementById('roster-table');
    if (!table) return;

    table.addEventListener('click', async e => {
        const btn = e.target.closest('button');
        if (!btn) return;

        if (btn.classList.contains('btn-audit')) {
            openAuditModal(btn.dataset.id);
            return;
        }

        if (btn.classList.contains('btn-delete')) {
            const reg = adminStore.get().registrations.find(r => r.id === btn.dataset.id);
            const name = reg?.name || 'este participante';
            if (!confirm(`¿Eliminar el registro de ${name}? Esta acción no se puede deshacer.`)) return;

            btn.disabled = true;
            btn.textContent = '…';
            try {
                const supabase = await getSupabaseClient();
                const { error } = await supabase.from('registrations').delete().eq('id', btn.dataset.id);
                if (error) throw error;
                updateDashboardData(supabase);
            } catch (err) {
                alert('Error al eliminar: ' + err.message);
                btn.disabled = false;
                btn.textContent = '🗑️';
            }
        }
    });
}

async function openAuditModal(regId) {
    const reg = adminStore.get().registrations.find(r => r.id === regId);
    if (!reg) return;

    const modal = document.getElementById('modal-payment-audit');
    if (!modal) return;

    document.getElementById('audit-hiker-name').textContent = reg.name;
    document.getElementById('audit-pay-method').textContent = reg.payment_method;
    document.getElementById('audit-pay-amount').textContent = `$${parseFloat(reg.total_usd).toFixed(2)}`;
    document.getElementById('audit-pay-ref').textContent = reg.reference_number || 'N/A';

    modal.style.display = 'flex';
    modal._currentId = regId;

    document.getElementById('btn-audit-close').onclick = () => { modal.style.display = 'none'; };

    document.getElementById('btn-audit-approve').onclick = async () => {
        const supabase = await getSupabaseClient();
        const { error } = await supabase
            .from('registrations')
            .update({ status: '🟢 Confirmado' })
            .eq('id', regId);
        if (error) { alert('Error al confirmar: ' + error.message); return; }
        modal.style.display = 'none';
        updateDashboardData(supabase);
    };

    document.getElementById('btn-audit-reject').onclick = async () => {
        if (!confirm('¿Rechazar este registro? Se liberará el cupo.')) return;
        const supabase = await getSupabaseClient();
        const { error } = await supabase
            .from('registrations')
            .update({ status: '🔴 Cancelado' })
            .eq('id', regId);
        if (!error) { modal.style.display = 'none'; updateDashboardData(supabase); }
    };
}