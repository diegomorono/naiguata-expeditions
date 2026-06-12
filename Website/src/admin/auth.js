/* =========================================================================
   ADMIN AUTHENTICATION (CONECTADO A TU-EDGE-FUNCTION-ADMIN)
   ========================================================================= */

export function setupAdminAuth(onSuccess) {
    const loginForm = document.getElementById('admin-login-form');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('admin-user')?.value;
        const password = document.getElementById('admin-password')?.value;

        try {
            // URL exacta de tu Edge Function
            const res = await fetch('https://cnoeumcshfrfrzyvbxcn.supabase.co/functions/v1/tu-edge-function-admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (!res.ok) {
                throw new Error('Credenciales inválidas');
            }

            const { token } = await res.json();

            // Guardamos el token real (JWT) devuelto por la Edge Function
            sessionStorage.setItem('admin_token', token);

            onSuccess();

        } catch (error) {
            console.error("Falla en el login:", error);
            alert("Acceso denegado. Verifica tus credenciales.");
        }
    });
}