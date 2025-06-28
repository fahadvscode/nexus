// supabase/functions/get-twilio-token/index.ts
// FORCE DEPLOYMENT v7 - JWT WITH NBF FIELD + API KEY AUTH + CORS FIX - June 26, 2025
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
    console.log('🔄 v7: Processing Twilio token request...')
    
    // Check for authorization header
    const authHeader = req.headers.get('Authorization')
    
    if (!authHeader) {
      console.error('❌ No Authorization header found')
      throw new Error('Authorization header required')
    }
    
    console.log('✅ Authorization header found')

    // Create a Supabase client with service role for server-side validation
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { 
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    // Manually verify the JWT token
    const jwt = authHeader.replace('Bearer ', '')

    // Get the user from the JWT token using service role client
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(jwt)
    
    if (userError) {
      console.error('❌ User validation error:', userError.message)
      throw new Error(`User validation failed: ${userError.message}`)
    }
    
    if (!user) {
      console.error('❌ No user found for JWT token')
      throw new Error('User not found - invalid JWT token')
    }
    
    console.log('✅ User validated:', user.email)

    // Get Twilio credentials from environment variables - API KEY APPROACH
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const apiKeySid = Deno.env.get('TWILIO_API_KEY_SID')
    const apiKeySecret = Deno.env.get('TWILIO_API_KEY_SECRET')
    const twimlAppSid = Deno.env.get('TWIML_APP_SID')
    
    // Check for missing credentials
    if (!accountSid || !apiKeySid || !apiKeySecret || !twimlAppSid) {
      const missing = []
      if (!accountSid) missing.push('TWILIO_ACCOUNT_SID')
      if (!apiKeySid) missing.push('TWILIO_API_KEY_SID')
      if (!apiKeySecret) missing.push('TWILIO_API_KEY_SECRET')
      if (!twimlAppSid) missing.push('TWIML_APP_SID')
      throw new Error(`Missing Twilio credentials: ${missing.join(', ')}`)
    }
    
    console.log('✅ All Twilio credentials found')
    console.log('🔧 Using API Key authentication v7')
    
    // Manually construct the JWT for Twilio using API Key auth
    const identity = user.email!
    const now = Math.floor(Date.now() / 1000)
    const exp = now + 3600 // 1 hour expiration
    const jti = `${apiKeySid}-${now}`

    // JWT Header - exactly as per Twilio specification
    const header = { 
      typ: 'JWT', 
      alg: 'HS256', 
      cty: 'twilio-fpa;v=1' 
    }
    
    // JWT Payload - API KEY approach (issuer is API Key SID)
    const payload = {
      jti,                    // Unique identifier for this token
      iss: apiKeySid,         // Issuer - API Key SID 
      sub: accountSid,        // Subject - Account SID
      iat: now,               // Issued at time
      nbf: now,               // Not before time (required by Twilio)
      exp,                    // Expiration time
      grants: {
        identity,             // User identity
        voice: {
          outgoing: { 
            application_sid: twimlAppSid 
          },
          incoming: { 
            allow: true 
          }
        }
      }
    }

    console.log('🔧 DEPLOYMENT VERSION: v7 - API KEY AUTHENTICATION + CORS FIX - June 26, 2025')

    const headerB64 = base64Encode(new TextEncoder().encode(JSON.stringify(header))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
    const payloadB64 = base64Encode(new TextEncoder().encode(JSON.stringify(payload))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
    const unsignedToken = `${headerB64}.${payloadB64}`
    
    // Use API Key Secret as the signing key (not Auth Token)
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(apiKeySecret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(unsignedToken))
    const signatureB64 = base64Encode(new Uint8Array(signature)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
    const token = `${unsignedToken}.${signatureB64}`

    console.log('✅ Twilio token generated successfully for user:', user.email)
    
    return new Response(JSON.stringify({ token }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('❌ Twilio token generation failed:', error.message)
    
    const errorMessage = error.message || 'Unknown error occurred'
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})