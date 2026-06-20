1. ## Database Schema

### admin_users
- id: bigint
- username: text
- email?: text
- password_hash?: text

### catering_inventory
- item_id: text
- item_name: text
- price_usd: numeric

### checklist_salidas
- id: uuid
- id_fecha: date
- task_id: text
- completed: boolean
- whatsapp_group_id?: text

### expedition_slots
- date: date
- reserved?: integer
- max_capacity?: integer

### financial_transactions
- id: uuid
- created_at: timestamptz
- registration_id?: text
- date: date
- type: text
- concept: text
- category?: text
- account: text
- currency: text
- amount_original: numeric
- exchange_rate: numeric
- total_neto_usd: numeric

### inventory_stock
- item_id: text
- item_name: text
- owned_qty: integer
- consignment_qty: integer
- total_quantity?: integer
- price_usd: numeric

### logistic_services
- service_id: text
- service_name: text
- price_usd: numeric
- is_per_day?: boolean

### registrations
- id: text
- date: date
- name: text
- email: text
- whatsapp: text
- group_code: text
- gender: text
- tent_preference: text
- allergies?: text
- diet: text
- medical?: text
- rentals: jsonb
- catering: jsonb
- porter_service?: text
- total_usd: numeric
- payment_method: text
- reference_number?: text
- status: text
- created_at: timestamptz

### system_settings
- key: text
- value: jsonb

2. ## Row Level Security (RLS)

Global Rule: Admin check uses `auth.jwt() -> 'app_metadata' ->> 'role' == 'admin'`.

### system_settings
- SELECT: public (true)

### logistic_services
- SELECT: public (true)

### checklist_salidas
- ALL: public (true)
- ALL: authenticated (role == admin)

### financial_transactions
- ALL: public (true)
- SELECT, UPDATE, DELETE: authenticated (role == admin)
- INSERT: service_role (true)

### registrations
- INSERT: public (true)
- INSERT: public (status == '🟡 Pendiente por Verificar' AND total_usd >= 50)
- SELECT, UPDATE, DELETE: authenticated (role == admin)

### inventory_stock
- SELECT: public (true)
- ALL: authenticated (role == admin)

### catering_inventory
- SELECT: public (true)
- ALL: authenticated (role == admin)

3. Base de Datos (RPC)

register_hiker(p_id: text, p_date: date, p_name: text, p_email: text, p_whatsapp: text, p_group_code: text, p_gender: text, p_tent_preference: text, p_allergies: text, p_diet: text, p_medical: text, p_rentals: jsonb, p_catering: jsonb, p_porter_service: text, p_total_usd: numeric, p_payment_method: text, p_reference_number: text): jsonb

registrar_transaccion_segura(p_registration_id: text, p_date: date, p_type: text, p_concept: text, p_category: text, p_account: text, p_currency: text, p_amount_original: numeric, p_exchange_rate: numeric, p_total_neto_usd: numeric): void

sync_canceled_slot(): trigger

registrar_excursionista(p_id: text, p_date: date, p_name: text, p_email: text, p_whatsapp: text, p_group_code: text, p_gender: text, p_tent_preference: text, p_allergies: text, p_diet: text, p_medical: text, p_rentals: jsonb, p_catering: jsonb, p_porter_service: text, p_total_usd: numeric, p_payment_method: text, p_reference_number: text): jsonb

registrar_excursionista(p_id: uuid, p_date: date, p_name: text, p_email: text, p_whatsapp: text, p_group_code: text, p_gender: text, p_tent_preference: text, p_allergies: text, p_diet: text, p_medical: text, p_rentals: jsonb, p_catering: jsonb, p_wants_porter: boolean, p_payment_method: text, p_reference_number: text): jsonb

4. ## Edge Functions (Endpoints API)

tu-edge-function-admin(body: { username?: text, password?: text, action?: 'get_registrations', date?: date }): POST
- Local Path: /supabase/functions/tu-edge-function-admin/index.ts
- CORS: Dinámico vía ALLOWED_ORIGIN (Fallback: https://naiguata-expeditions.vercel.app). Permite headers standard y apikey.
- Secrets Requeridos: ALLOWED_ORIGIN, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_USERNAME_HASH, ADMIN_PASSWORD_HASH
- Lógica Auth Admin: Si recibe username/password, los valida usando hash SHA-256 híbrido contra env vars (Fallback username: 'diegomorono'). Retorna { token: SUPABASE_SERVICE_ROLE_KEY } como credencial maestra de bypass para el cliente.
- Lógica Get Registrations: Si action == 'get_registrations', requiere parámetro date de forma obligatoria y realiza un bypass RLS vía service role para retornar filas de la tabla 'registrations' que coincidan con la fecha dada.

5. ## Environment Variables & Secrets

EMAILJS_SERVICE_ID: Identificador único del servicio en EmailJS encargado de gestionar el enrutamiento de correos electrónicos del sistema.
EMAILJS_TEMPLATE_ID: Identificador de la plantilla de EmailJS estructurada para las notificaciones automáticas de las expediciones.
EMAILJS_PUBLIC_KEY: Llave pública de EmailJS requerida para inicializar y autenticar las solicitudes de mensajería desde el cliente o funciones.
EMAILJS_PRIVATE_KEY: Llave secreta de EmailJS restringida al entorno del servidor para firmar peticiones seguras de envío de correos.
ADMIN_USERNAME_HASH: Hash de verificación criptográfica SHA-256 almacenado en los secrets de Supabase para validar la identidad del administrador en la Edge Function de control.
ADMIN_PASSWORD_HASH: Hash criptográfico SHA-256 utilizado para contrastar de forma segura la contraseña maestra y otorgar el token de acceso con bypass de RLS.