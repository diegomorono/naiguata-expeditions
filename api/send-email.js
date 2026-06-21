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
                template_params: templateParams || {}
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