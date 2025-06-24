// supabase/functions/get-twilio-token/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { encode as base64Encode } from 'https://deno.land/std@0.168.0/encoding/base64.ts'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Required for CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the user's auth token
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Get the user from the auth token
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error('User not found')

    // Get Twilio credentials from environment variables
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')!
    const apiKeySid = Deno.env.get('TWILIO_API_KEY_SID')!
    const apiKeySecret = Deno.env.get('TWILIO_API_KEY_SECRET')!
    const twimlAppSid = Deno.env.get('TWIML_APP_SID')!
    
    // Manually construct the JWT for Twilio
    const identity = user.email!
    const now = Math.floor(Date.now() / 1000)
    const exp = now + 3600 // 1 hour expiration

    const header = { typ: 'JWT', alg: 'HS256', cty: 'twilio-fpa;v=1' }
    const payload = {
      iss: apiKeySid,
      sub: accountSid,
      exp,
      jti: `${apiKeySid}-${now}`,
      grants: {
        identity,
        voice: {
          outgoing: { application_sid: twimlAppSid },
          incoming: { allow: true }
        }
      }
    }

    const headerB64 = base64Encode(new TextEncoder().encode(JSON.stringify(header))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
    const payloadB64 = base64Encode(new TextEncoder().encode(JSON.stringify(payload))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
    const unsignedToken = `${headerB64}.${payloadB64}`
    
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(apiKeySecret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(unsignedToken))
    const signatureB64 = base64Encode(new Uint8Array(signature)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
    const token = `${unsignedToken}.${signatureB64}`

    return new Response(JSON.stringify({ token }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})