/* ==========================================================================
   ESTADO GLOBAL CENTRALIZADO Y REACTIVO DE LA APLICACIÓN
   ========================================================================== */

/**
 * Estado operacional de la interfaz pública (Excursionistas)
 */
export const appState = {
    activeView: 'client-view',
    bcvRate: 580.00,
    bcvSource: 'default',
    activeStepIndex: 0,
    inventory: [],
    logisticServices: [],
    cateringCatalog: []
};

/**
 * Estado operacional de la consola interna (Administración)
 */
export const adminState = {
    selectedDate: null,       // Almacena la fecha seleccionada en el carrusel de expediciones
    registrations: [],        // Colección de excursionistas para la fecha seleccionada
    financials: [],           // Historial de transacciones de caja chica y permutas
    catalogs: {
        inventory: [],
        services: [],
        catering: []
    }
};