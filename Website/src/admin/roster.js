import { adminStore } from '../config/state.js';
import { getSupabaseClient } from '../config/supabase.js';
import { updateDashboardData } from './core.js';

export function renderRoster() {
    const container = document.getElementById('roster-table-body');
    if (!container) return;

    container.innerHTML = '';
    const registrations = adminStore.get().registrations || [];

    if (registrations.length === 0) {
        container.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 30px; opacity: 0.5;">No hay participantes registrados para esta fecha.</td></tr>`;
        return;
    }

    registrations.forEach(reg => {
        const tr = document.createElement('tr');
        tr.className = reg.medical && reg.medical !== 'Ninguna.' ? 'hiker-row-alert' : '';
        if (tr.className) {
            tr.style.background = 'rgba(239, 68, 68, 0.05)';
        }

        // Formateo de rentals y catering para visualización compacta
        const rentalsText = reg.rentals && typeof reg.rentals === 'object' 
            ? Object.entries(reg.rentals).map(([k, v]) => `${k} (x${v})`).join(', ') 
            : 'Ninguno';

        const statusBadge = getStatusBadge(reg.status);
        const healthIcon = reg.medical && reg.medical !== 'Ninguna.' ? '🔴' : '🟢';

        tr.innerHTML = `
            <td style="padding: 12px 10px;">
                <div style="font-weight: 600;">${reg.name}</div>
                <div style="font-size: 0.75rem; opacity: 0.6;">C.I: ${reg.reference_number || 'N/A'}</div>
            </td>
            <td style="padding: 12px 10px;">
                <a href="https://wa.me/${reg.whatsapp?.replace(/[^0-9]/g, '')}" target="_blank" class="roster-whatsapp-link">
                    ${reg.whatsapp}
                </a>
            </td>
            <td style="padding: 12px 10px;">
                <span class="badge" style="margin: 0; background: rgba(255,255,255,0.05); color: #fff;">${reg.group_code}</span>
            </td>
            <td style="padding: 12px 10px; text-align: center;">${reg.gender}</td>
            <td style="padding: 12px 10px;">
                <div style="font-size: 0.8rem;">${reg.tent_preference}</div>
                <div style="font-size: 0.7rem; color: var(--secondary);">Eq: ${rentalsText}</div>
            </td>
            <td style="padding: 12px 10px;">
                <div title="${reg.medical || 'Sin observaciones'}">${healthIcon} ${reg.medical || 'Ninguna'}</div>
            </td>
            <td style="padding: 12px 10px;">
                <div>${statusBadge}</div>
                <div style="font-weight: 700; color: var(--primary); margin-top: 4px;">$${parseFloat(reg.total_usd || 0).toFixed(2)}</div>
            </td>
            <td style="padding: 12px 10px; text-align: center;">
                <div style="display: flex; gap: 5px; justify-content: center;">
                    ${reg.status.includes('Pendiente') ? `<button class="btn-primary btn-small btn-audit" data-id="${reg.id}">Validar</button>` : ''}
                    <button class="btn-secondary btn-small btn-delete" data-id="${reg.id}">🗑️</button>
                </div>
            </td>
        `;

        container.appendChild(tr);
    });

    setupRosterListeners();
}

function getStatusBadge(status) {
    if (status.includes('Confirmado')) return `<span class="badge badge-green" style="margin:0; font-size: 0.65rem;">🟢 CONFIRMADO</span>`;
    if (status.includes('Pendiente')) return `<span class="badge badge-orange" style="margin:0; font-size: 0.65rem;">🟡 PENDIENTE</span>`;
    return `<span class="badge" style="margin:0; font-size: 0.65rem; background: #444; color: #ccc;">${status}</span>`;
}

function setupRosterListeners() {
    // Listener para botones de Auditoría
    document.querySelectorAll('.btn-audit').forEach(btn => {
        btn.onclick = () => openAuditModal(btn.getAttribute('data-id'));
    });

    // Listener para borrar (placeholder)
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.onclick = async () => {
            if (confirm("¿Estás seguro de eliminar este registro? Esta acción no se puede deshacer.")) {
                const supabase = await getSupabaseClient();
                const { error } = await supabase.from('registrations').delete().eq('id', btn.getAttribute('data-id'));
                if (!error) updateDashboardData(supabase);
            }
        };
    });
}

/**
 * MODAL DE AUDITORÍA DE PAGOS
 */
async function openAuditModal(regId) {
    const reg = adminStore.get().registrations.find(r => r.id === regId);
    if (!reg) return;

    const modal = document.getElementById('modal-payment-audit');
    if (!modal) return;

    // Poblar modal
    document.getElementById('audit-hiker-name').textContent = reg.name;
    document.getElementById('audit-pay-method').textContent = reg.payment_method;
    document.getElementById('audit-pay-amount').textContent = `$${parseFloat(reg.total_usd).toFixed(2)}`;
    document.getElementById('audit-pay-ref').textContent = reg.reference_number || 'N/A';

    modal.classList.add('active');
    modal.style.display = 'flex';

    // Handlers de botones
    document.getElementById('btn-audit-close').onclick = () => { modal.style.display = 'none'; };

    document.getElementById('btn-audit-approve').onclick = async () => {
        const supabase = await getSupabaseClient();

        // 1. Actualizar estatus a Confirmado
        const { error: updateError } = await supabase
            .from('registrations')
            .update({ status: '🟢 Confirmado' })
            .eq('id', regId);

        if (updateError) {
            alert("Error al confirmar: " + updateError.message);
            return;
        }

        // 2. Inyectar transacción en financial_transactions (Opcional, según lógica de negocio solicitada)
        // Por ahora, recargamos el dashboard
        modal.style.display = 'none';
        updateDashboardData(supabase);
    };

    document.getElementById('btn-audit-reject').onclick = async () => {
        if (confirm("¿Rechazar este registro? Se liberará el cupo.")) {
            const supabase = await getSupabaseClient();
            const { error } = await supabase
                .from('registrations')
                .update({ status: '🔴 Cancelado' })
                .eq('id', regId);

            if (!error) {
                modal.style.display = 'none';
                updateDashboardData(supabase);
            }
        }
    };
}