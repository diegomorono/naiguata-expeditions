/* =========================================================================
   ADMIN AUTHENTICATION (CONECTADO A LA EDGE FUNCTION tu-edge-function-admin)
   ========================================================================= */
import { ENV } from '../config/env.js';

const EDGE_FUNCTION_URL = `${ENV.SUPABASE_URL}/functions/v1/tu-edge-function-admin`;

export function setupAdminAuth(onSuccess) {
    const loginForm = document.getElementById('admin-login-form');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('admin-user')?.value?.trim();
        const password = document.getElementById('admin-password')?.value;
        const errorMsg = document.getElementById('login-error-msg');
        const submitBtn = document.getElementById('btn-login-submit');

        if (errorMsg) errorMsg.style.display = 'none';
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Verificando...'; }

        try {
            const response = await fetch(EDGE_FUNCTION_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // La Edge Function requiere apikey/authorization aunque verify_jwt=false,
                    // porque Supabase exige la anon key para no bloquear en el gateway.
                    'apikey': ENV.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${ENV.SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (!response.ok || !data.token) {
                throw new Error(data.error || 'Credenciales inválidas.');
            }

            // Guardamos el token (service_role key) para autorizar llamadas posteriores
            sessionStorage.setItem('admin_token', data.token);

            if (window.supabase?.rest?.headers) {
                window.supabase.rest.headers['Authorization'] = `Bearer ${data.token}`;
            }

            onSuccess();

        } catch (error) {
            console.error("Falla en el login administrativo:", error.message);
            if (errorMsg) {
                errorMsg.textContent = `⚠️ ${error.message}`;
                errorMsg.style.display = 'block';
            } else {
                alert(`Acceso denegado: ${error.message}`);
            }
        } finally {
            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Iniciar Sesión'; }
        }
    });
}