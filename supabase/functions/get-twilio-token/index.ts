// supabase/functions/get-twilio-token/index.ts
// FORCE DEPLOYMENT v4 - JWT WITH NBF FIELD - June 24, 2025
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
    console.log('🔄 Processing Twilio token request...')
    
    // Check for authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('❌ No Authorization header found')
      throw new Error('Authorization header required')
    }
    
    console.log('✅ Authorization header found')

    // Create a Supabase client with the user's auth token
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Get the user from the auth token
    console.log('🔍 Validating user session...')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    
    if (userError) {
      console.error('❌ User validation error:', userError)
      throw new Error(`User validation failed: ${userError.message}`)
    }
    
    if (!user) {
      console.error('❌ No user found in session')
      throw new Error('User not found - invalid session')
    }
    
    console.log('✅ User validated:', user.email)

    // Get Twilio credentials from environment variables (using Auth Token approach)
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN')
    const twimlAppSid = Deno.env.get('TWIML_APP_SID')
    
    // Check for missing credentials
    console.log('🔍 Checking Twilio credentials...')
    if (!accountSid) {
      console.error('❌ TWILIO_ACCOUNT_SID not found')
      throw new Error('TWILIO_ACCOUNT_SID not found')
    }
    if (!authToken) {
      console.error('❌ TWILIO_AUTH_TOKEN not found')
      throw new Error('TWILIO_AUTH_TOKEN not found')
    }
    if (!twimlAppSid) {
      console.error('❌ TWIML_APP_SID not found')
      throw new Error('TWIML_APP_SID not found')
    }
    console.log('✅ All Twilio credentials found')
    console.log('🔧 Using Auth Token authentication')
    
    // Manually construct the JWT for Twilio using Auth Token
    const identity = user.email!
    const now = Math.floor(Date.now() / 1000)
    const exp = now + 3600 // 1 hour expiration
    const jti = `${accountSid}-${now}`

    // JWT Header - exactly as per Twilio specification
    const header = { 
      typ: 'JWT', 
      alg: 'HS256', 
      cty: 'twilio-fpa;v=1' 
    }
    
    // JWT Payload - exactly as per Twilio Voice SDK specification
    const payload = {
      jti,                    // Unique identifier for this token
      iss: accountSid,        // Issuer - Account SID for Auth Token approach
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

    console.log('🔧 JWT Payload:', JSON.stringify(payload, null, 2))

    const headerB64 = base64Encode(new TextEncoder().encode(JSON.stringify(header))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
    const payloadB64 = base64Encode(new TextEncoder().encode(JSON.stringify(payload))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
    const unsignedToken = `${headerB64}.${payloadB64}`
    
    // Use Auth Token as the signing key
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(authToken), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(unsignedToken))
    const signatureB64 = base64Encode(new Uint8Array(signature)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
    const token = `${unsignedToken}.${signatureB64}`

    console.log('✅ Twilio token generated successfully for user:', user.email)
    console.log('🎯 Token preview:', token.substring(0, 50) + '...')
    
    return new Response(JSON.stringify({ token }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('❌ Twilio token generation failed:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})