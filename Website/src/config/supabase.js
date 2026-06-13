/* ==========================================================================
   INFRAESTRUCTURA DE DATOS - CONFIGURACIÓN DE SUPABASE
   ========================================================================== */

import { ENV } from './env.js';

let supabaseClient = null;
let _initPromise = null;

/**
 * Resuelve y retorna el cliente único de Supabase esperando de forma reactiva al CDN.
 * @returns {Promise<Object>} Instancia configurada del cliente de Supabase.
 */
export function getSupabaseClient() {
    if (_initPromise) return _initPromise;

    _initPromise = new Promise((resolve, reject) => {

        // Función interna para configurar el cliente una vez que la librería global exista
        const initializeClient = () => {
            try {
                const token = sessionStorage.getItem('admin_token');
                const options = {};
                if (token) {
                    options.global = {
                        headers: { Authorization: `Bearer ${token}` }
                    };
                }
                supabaseClient = window.supabase.createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, options);
                console.log("[Naiguatá Infra] Supabase inicializado correctamente desde módulo central.");
                resolve(supabaseClient);
            } catch (error) {
                reject(error);
            }
        };

        // 1. CASO INMEDIATO: Si el CDN ya cargó y está disponible en el objeto window
        if (window.supabase && typeof window.supabase.createClient === 'function') {
            return initializeClient();
        }

        // 2. CASO REACTIVO: Si no ha cargado, buscamos el script en el DOM para escuchar su evento 'load'
        const script = document.querySelector('script[src*="supabase-js"]');

        if (script) {
            // El script ya existe en el HTML, solo esperamos a que termine de procesarse
            script.addEventListener('load', initializeClient);
            script.addEventListener('error', () => reject(new Error('El CDN de Supabase falló al cargar.')));
        } else {
            // 3. CASO DE RESPALDO (MutationObserver): Por si el script aún no se ha parseado en el DOM
            const observer = new MutationObserver((mutations, obs) => {
                const targetScript = document.querySelector('script[src*="supabase-js"]');
                if (targetScript) {
                    targetScript.addEventListener('load', initializeClient);
                    targetScript.addEventListener('error', () => reject(new Error('El CDN de Supabase falló al cargar.')));
                    obs.disconnect(); // Dejamos de observar inmediatamente para liberar memoria
                }
            });

            // Escuchamos los cambios en todo el documento de forma asíncrona
            observer.observe(document.documentElement, {
                childList: true,
                subtree: true
            });

            // Mantenemos un salvavidas de tiempo límite (5s) para desconectar el observer si el CDN nunca llega
            setTimeout(() => {
                observer.disconnect();
                if (!window.supabase) {
                    reject(new Error('El CDN de Supabase no se detectó en el tiempo límite permitido.'));
                }
            }, 5000);
        }
    });

    return _initPromise;
}