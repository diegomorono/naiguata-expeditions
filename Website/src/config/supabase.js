/* ==========================================================================
   INFRAESTRUCTURA DE DATOS - CONFIGURACIÓN DE SUPABASE
   ========================================================================== */

const SUPABASE_URL = '__SUPABASE_URL__';
const SUPABASE_ANON_KEY = '__SUPABASE_ANON_KEY__';

let supabaseClient = null;
let _initPromise = null;

/**
 * Resuelve y retorna el cliente único de Supabase esperando activamente al CDN.
 * @returns {Promise<Object>} Instancia configurada del cliente de Supabase.
 */
export function getSupabaseClient() {
    if (_initPromise) return _initPromise;

    _initPromise = new Promise((resolve, reject) => {
        const MAX_WAIT = 5000;
        const start = Date.now();

        const check = () => {
            // Verifica si la librería global cargada desde el CDN ya está disponible en el objeto window
            if (window.supabase && typeof window.supabase.createClient === 'function') {
                const token = sessionStorage.getItem('admin_token');
                const options = {};
                if (token) {
                    options.global = {
                        headers: { Authorization: `Bearer ${token}` }
                    };
                }
                supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, options);
                console.log("[Naiguatá Infra] Supabase inicializado correctamente desde módulo central.");
                return resolve(supabaseClient);
            }
            if (Date.now() - start > MAX_WAIT) {
                return reject(new Error('El CDN de Supabase no cargó en el tiempo límite permitido.'));
            }
            setTimeout(check, 100);
        };
        check();
    });

    return _initPromise;
}