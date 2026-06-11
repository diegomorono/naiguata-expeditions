module.exports = async (req, res) => {
    // Restringir el endpoint para que solo acepte peticiones POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido. Usa POST.' });
    }

    try {
        const templateParams = req.body;

        // Llamada interna y segura hacia la API REST de EmailJS usando tus variables secretas
        const emailjsResponse = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                service_id: process.env.EMAILJS_SERVICE_ID,
                template_id: process.env.EMAILJS_TEMPLATE_ID,
                user_id: process.env.EMAILJS_PUBLIC_KEY,
                accessToken: process.env.EMAILJS_PRIVATE_KEY,
                template_params: templateParams
            })
        });

        if (emailjsResponse.ok) {
            return res.status(200).json({ success: true, message: 'Notificación procesada y enviada de forma segura.' });
        } else {
            const errorText = await emailjsResponse.text();
            console.error('Error reportado por EmailJS:', errorText);
            return res.status(emailjsResponse.status).json({ error: 'Fallo en el servicio externo de correo.', details: errorText });
        }
    } catch (error) {
        console.error('Error interno en la Serverless Function:', error);
        return res.status(500).json({ error: 'Error interno del servidor.', message: error.message });
    }
};