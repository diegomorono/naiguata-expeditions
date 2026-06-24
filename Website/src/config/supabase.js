/* ==========================================================================
   INFRAESTRUCTURA DE DATOS — CONFIGURACIÓN DE SUPABASE
   Soporta reinicialización con service_role token post-login admin.
   ========================================================================== */

import { ENV } from './env.js';

let supabaseClient = null;
let _initPromise = null;

/**
 * Inicializa el cliente con una key específica (anon o service_role).
 * @param {string} key — La API key a utilizar.
 * @returns {Object} Cliente de Supabase configurado.
 */
function buildClient(key) {
    if (!window.supabase || typeof window.supabase.createClient !== 'function') {
        throw new Error('El SDK de Supabase no está disponible en window.supabase.');
    }
    return window.supabase.createClient(ENV.SUPABASE_URL, key, {
        auth: { persistSession: false }
    });
}

/**
 * Espera a que el CDN de Supabase esté disponible en el DOM.
 * @returns {Promise<void>}
 */
function waitForCDN() {
    return new Promise((resolve, reject) => {
        if (window.supabase && typeof window.supabase.createClient === 'function') {
            return resolve();
        }

        const script = document.querySelector('script[src*="supabase-js"]');

        if (script) {
            script.addEventListener('load', resolve, { once: true });
            script.addEventListener('error', () => reject(new Error('El CDN de Supabase falló al cargar.')), { once: true });
            return;
        }

        const observer = new MutationObserver((_mutations, obs) => {
            const target = document.querySelector('script[src*="supabase-js"]');
            if (target) {
                obs.disconnect();
                target.addEventListener('load', resolve, { once: true });
                target.addEventListener('error', () => reject(new Error('El CDN de Supabase falló al cargar.')), { once: true });
            }
        });

        observer.observe(document.documentElement, { childList: true, subtree: true });

        setTimeout(() => {
            observer.disconnect();
            if (!window.supabase) reject(new Error('El CDN de Supabase no se detectó en el tiempo límite.'));
        }, 6000);
    });
}

/**
 * Retorna el cliente público (anon key). Crea y cachea si no existe.
 * Usado por el formulario público de reservas.
 * @returns {Promise<Object>}
 */
export async function getSupabaseClient() {
    if (supabaseClient) return supabaseClient;

    if (_initPromise) return _initPromise;

    _initPromise = waitForCDN().then(() => {
        supabaseClient = buildClient(ENV.SUPABASE_ANON_KEY);
        console.log('[Naiguatá Infra] Cliente público (anon) inicializado.');
        return supabaseClient;
    });

    return _initPromise;
}

/**
 * Crea (o recrea) un cliente autenticado con el service_role token.
 * Siempre devuelve un cliente NUEVO con la key provista — no cachea,
 * porque el token puede cambiar entre sesiones de login.
 * @param {string} serviceToken — El token recibido de la Edge Function tras login exitoso.
 * @returns {Object} Cliente de Supabase con bypass de RLS.
 */
export function getAdminClient(serviceToken) {
    if (!serviceToken) throw new Error('Se requiere un serviceToken para getAdminClient().');

    // Espera síncrona: en el contexto admin el CDN ya está cargado
    if (!window.supabase || typeof window.supabase.createClient !== 'function') {
        throw new Error('El SDK de Supabase no está disponible. Asegúrate de que el CDN cargó.');
    }

    const client = window.supabase.createClient(ENV.SUPABASE_URL, serviceToken, {
        auth: { persistSession: false }
    });

    console.log('[Naiguatá Infra] Cliente admin (service_role) creado.');
    return client;
}