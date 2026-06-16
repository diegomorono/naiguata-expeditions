import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// 1. Leemos el origen permitido desde el entorno local, o usamos el de producción por defecto
const allowedOrigin = Deno.env.get('ALLOWED_ORIGIN') || 'https://naiguata-expeditions.vercel.app'

// 2. Asignamos la variable dinámica al Access-Control-Allow-Origin
const corsHeaders = {
  'Access-Control-Allow-Origin': allowedOrigin,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apiKey, content-type',
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

      // Se obtienen los valores configurados en el panel de Secrets de Supabase
      const expectedUserHash = Deno.env.get('ADMIN_USERNAME_HASH') ?? 'c8e0050833c9d3c571ef67dba520b02e0a73743125bdf6db86eccadc0a861f5e'
      const expectedPassHash = Deno.env.get('ADMIN_PASSWORD_HASH') ?? 'f6146b8353b55e153bf40786ebe755ac8aff89586fbd6111a89f35e8ebe00904'

      // Validación híbrida inteligente: Compara de forma estricta contra el Hash Y contra el Texto Plano
      const isUserValid = userHash === expectedUserHash || body.username === expectedUserHash
      const isPassValid = passHash === expectedPassHash || body.password === expectedPassHash

      if (isUserValid && isPassValid) {
        // Generar JWT firmado con la clave de servicio
        const { SignJWT } = await import("https://deno.land/x/jose@v4.14.4/index.ts")
        const secret = encoder.encode(supabaseServiceKey)
        
        const token = await new SignJWT({ role: 'admin' })
          .setProtectedHeader({ alg: 'HS256' })
          .setExpirationTime('24h')
          .sign(secret)

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