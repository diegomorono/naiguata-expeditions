export default async function handler(req, res) {
    // Configurar cabeceras CORS para permitir peticiones desde el frontend de forma segura
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*'); // Puedes cambiar '*' por tu dominio específico en producción
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Manejar de forma inmediata la petición preflight de CORS (método OPTIONS)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Restringir el endpoint para que solo acepte peticiones POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido. Usa POST.' });
    }

    // Validar preventivamente que las variables de entorno críticas estén configuradas en el servidor
    const {
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        EMAILJS_PUBLIC_KEY,
        EMAILJS_PRIVATE_KEY
    } = process.env;

    if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY || !EMAILJS_PRIVATE_KEY) {
        console.error('Error interno: Faltan variables de entorno de EmailJS por configurar.');
        return res.status(500).json({ error: 'Error de configuración interna en el servidor.' });
    }

    try {
        // Asegurar que req.body sea procesado correctamente incluso si llega como string
        const templateParams = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

        // --- NUEVO: Formateadores dinámicos para las variables de tu plantilla ---
        const parseObjectToText = (obj) => {
            if (!obj) return 'Ninguno';
            if (typeof obj === 'object') {
                const entries = Object.entries(obj).filter(([_, qty]) => qty > 0);
                if (entries.length === 0) return 'Ninguno';
                return entries.map(([item, qty]) => `${item.replace(/_/g, ' ')} (x${qty})`).join(', ');
            }
            return String(obj);
        };

        const parsePorterService = (val) => {
            if (!val) return 'No solicitado';
            if (val === 'porter-2p') return 'Servicio de Portador - Carpa 2P';
            if (val === 'porter-3p') return 'Servicio de Portador - Carpa 3P';
            if (val === 'porter-4p') return 'Servicio de Portador - Carpa 4P';
            return val;
        };

        // Construir el objeto de parámetros enriquecido combinando los originales y los nuevos textos
        const enrichedParams = {
            ...(templateParams || {}),
            pass_id: templateParams?.id || 'N/A',
            rentals_text: parseObjectToText(templateParams?.rentals),
            catering_text: parseObjectToText(templateParams?.catering),
            porter_text: parsePorterService(templateParams?.porter_service)
        };
        // -----------------------------------------------------------------------

        // Llamada interna y segura hacia la API REST de EmailJS usando tus variables secretas
        const emailjsResponse = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                service_id: EMAILJS_SERVICE_ID,
                template_id: EMAILJS_TEMPLATE_ID,
                user_id: EMAILJS_PUBLIC_KEY,
                accessToken: EMAILJS_PRIVATE_KEY,
                template_params: enrichedParams
            })
        });

        if (emailjsResponse.ok) {
            return res.status(200).json({ success: true, message: 'Notificación procesada y enviada de forma segura.' });
        } else {
            const errorText = await emailjsResponse.text();
            console.error('Error reportado por EmailJS:', errorText);
            return res.status(emailjsResponse.status || 400).json({ error: 'Fallo en el servicio externo de correo.', details: errorText });
        }
    } catch (error) {
        console.error('Error interno en la Serverless Function:', error);
        return res.status(500).json({ error: 'Error interno del servidor.', message: error.message });
    }
}