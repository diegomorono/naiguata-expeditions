import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const allowedOrigin = Deno.env.get('ALLOWED_ORIGIN') || 'https://naiguata-expeditions.vercel.app'

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

    // =========================================================================
    // ACCIÓN PÚBLICA: Obtener Pase por ID (Bypass RLS)
    // =========================================================================
    if (body.action === 'get_hiker_pass') {
      const { id } = body
      if (!id) throw new Error("Falta el ID del pase")
      
      const { data, error } = await supabase
        .from('registrations')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (error) throw error
      
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // =========================================================================
    // BLOQUE DE AUTENTICACIÓN ADMIN
    // =========================================================================
    if (body.username && body.password) {
      const encoder = new TextEncoder()
      const userBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(body.username))
      const userHash = Array.from(new Uint8Array(userBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
      
      const passBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(body.password))
      const passHash = Array.from(new Uint8Array(passBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')

      const expectedUserHash = Deno.env.get('ADMIN_USERNAME_HASH') ?? '952f446418870dfb6c6946399126dc6a0bf2ca3206b009e4695029a7386fc743'
      const expectedPassHash = Deno.env.get('ADMIN_PASSWORD_HASH') ?? 'f6146b8353b55e153bf40786ebe755ac8aff89586fbd6111a89f35e8ebe00904'

      if (userHash === expectedUserHash && passHash === expectedPassHash) {
        return new Response(JSON.stringify({ token: supabaseServiceKey }), {
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
    // ACCIONES ADMIN PROTEGIDAS
    // =========================================================================
    const { action, date } = body
    if (action === 'get_registrations') {
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
