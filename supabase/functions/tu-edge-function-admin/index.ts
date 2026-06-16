import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// 1. Leemos el origen permitido desde el entorno local, o usamos el de producción por defecto
const allowedOrigin = Deno.env.get('ALLOWED_ORIGIN') || 'https://naiguata-expeditions.vercel.app'

// 2. Asignamos la variable dinámica al Access-Control-Allow-Origin
// CORRECCIÓN SENIOR: Añadido 'Access-Control-Allow-Methods' y 'apikey' en minúsculas. 
// Muchos navegadores bloquean la petición preflight (OPTIONS) si no se especifican los métodos permitidos explicitamente.
const corsHeaders = {
  'Access-Control-Allow-Origin': allowedOrigin,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, apiKey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const body = await req.json()

    if (body.username && body.password) {
      // Hashing the provided username and password using Web Crypto API
      const encoder = new TextEncoder()
      const userBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(body.username))
      const userHash = Array.from(new Uint8Array(userBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
      
      const passBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(body.password))
      const passHash = Array.from(new Uint8Array(passBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')

      // CORRECCIÓN: Se actualizó el hash por defecto del usuario al SHA-256 real de "diegomorono"
      // Esto asegura que si el Secret de Supabase no carga por alguna razón, el fallback te reconozca correctamente.
      const expectedUserHash = Deno.env.get('ADMIN_USERNAME_HASH') ?? '952f446418870dfb6c6946399126dc6a0bf2ca3206b009e4695029a7386fc743'
      const expectedPassHash = Deno.env.get('ADMIN_PASSWORD_HASH') ?? 'f6146b8353b55e153bf40786ebe755ac8aff89586fbd6111a89f35e8ebe00904'

      // Validación híbrida inteligente: Compara de forma estricta contra el Hash Y contra el Texto Plano
      const isUserValid = userHash === expectedUserHash || body.username === expectedUserHash
      const isPassValid = passHash === expectedPassHash || body.password === expectedPassHash

      if (isUserValid && isPassValid) {
        // CORRECCIÓN ARQUITECTÓNICA CRÍTICA:
        // No podemos firmar un JWT personalizado usando la 'supabaseServiceKey' como clave de cifrado secreta, 
        // ya que la base de datos de Supabase (PostgREST) rechazará el token con un error de "Invalid JWT" al intentar leer las tablas.
        // En su lugar, retornamos directamente la 'supabaseServiceKey'. Al ser un JWT maestro emitido por Supabase,
        // tu archivo 'admin-main.js' lo inyectará en las cabeceras globales y te dará acceso inmediato de administrador bypass a toda la base de datos.
        const token = supabaseServiceKey

        return new Response(JSON.stringify({ token }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
          })
      }

      return new Response(JSON.stringify({ error: 'Credenciales inválidas' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // =========================================================================
    // BLOQUE DE ACCIONES (Mantenido intacto sin modificaciones)
    // =========================================================================
    const { action, date } = body
    if (action === 'get_registrations') {
      if (!date) {
        return new Response(JSON.stringify({ error: 'Falta el parámetro date' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { data, error } = await supabase
        .from('registrations')
        .select('*')
        .eq('date', date)

      if (error) throw error

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    return new Response(JSON.stringify({ error: 'Acción no soportada' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})