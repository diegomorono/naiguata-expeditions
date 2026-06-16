/* =========================================================================
   ADMIN AUTHENTICATION (CONECTADO A SUPABASE AUTH NATIVO)
   ========================================================================= */
import { getSupabaseClient } from '../config/supabase.js';

export function setupAdminAuth(onSuccess) {
    const loginForm = document.getElementById('admin-login-form');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Nota: Supabase Auth nativo utiliza Email en lugar de un Username genérico
        const email = document.getElementById('admin-user')?.value;
        const password = document.getElementById('admin-password')?.value;

        try {
            // 1. Obtener el cliente único e inicializado de Supabase
            const supabase = await getSupabaseClient();

            // 2. Autenticar directamente contra la tabla auth.users de Supabase
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) throw error;

            // 3. Extraer el token JWT real generado por la sesión nativa
            const token = data.session.access_token;

            // Guardamos el token en sessionStorage para la persistencia de la sesión
            sessionStorage.setItem('admin_token', token);

            // Vinculamos el token a las cabeceras globales de la instancia REST
            if (window.supabase?.rest?.headers) {
                window.supabase.rest.headers['Authorization'] = `Bearer ${token}`;
            }

            // Ejecutar el callback de éxito para dar paso al dashboard
            onSuccess();

        } catch (error) {
            console.error("Falla en el login administrativo:", error.message);
            alert(`Acceso denegado: ${error.message}. Asegúrate de ingresar tu correo y contraseña de Supabase.`);
        }
    });
}