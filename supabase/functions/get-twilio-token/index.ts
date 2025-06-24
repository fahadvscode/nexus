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
    console.log('🔍 All request headers:', Object.fromEntries(req.headers.entries()))
    
    if (!authHeader) {
      console.error('❌ No Authorization header found')
      throw new Error('Authorization header required')
    }
    
    console.log('✅ Authorization header found')
    console.log('🔍 Auth header length:', authHeader.length)

    // Create a Supabase client with service role for server-side validation
    console.log('🔍 Creating Supabase client with service role...')
    console.log('🔍 SUPABASE_URL:', Deno.env.get('SUPABASE_URL'))
    
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
    console.log('🔍 Manually verifying JWT token...')
    const jwt = authHeader.replace('Bearer ', '')
    console.log('🔍 JWT length:', jwt.length)

    // Get the user from the JWT token using service role client
    console.log('🔍 Validating user with JWT token...')
    console.log('🔍 Auth header:', authHeader.substring(0, 20) + '...')
    
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(jwt)
    
    if (userError) {
      console.error('❌ User validation error:', userError)
      console.error('❌ Error details:', JSON.stringify(userError, null, 2))
      throw new Error(`User validation failed: ${userError.message}`)
    }
    
    if (!user) {
      console.error('❌ No user found for JWT token')
      throw new Error('User not found - invalid JWT token')
    }
    
    console.log('✅ User validated from JWT:', user.email)
    console.log('✅ User ID:', user.id)

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
    console.log('🔍 Account SID:', accountSid?.substring(0, 10) + '...')
    console.log('🔍 Auth Token:', authToken?.substring(0, 8) + '...')
    console.log('🔍 TwiML App SID:', twimlAppSid?.substring(0, 10) + '...')
    
    // Manually construct the JWT for Twilio using Auth Token
    const identity = user.email!
    const now = Math.floor(Date.now() / 1000)
    const exp = now + 3600 // 1 hour expiration
    const jti = `${accountSid}-${now}`

    console.log('🔍 Token parameters:')
    console.log('🔍 Identity:', identity)
    console.log('🔍 Current time:', now)
    console.log('🔍 Expiration:', exp)

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

    console.log('🔍 JWT Header:', JSON.stringify(header))
    console.log('🔧 JWT Payload:', JSON.stringify(payload, null, 2))

    const headerB64 = base64Encode(new TextEncoder().encode(JSON.stringify(header))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
    const payloadB64 = base64Encode(new TextEncoder().encode(JSON.stringify(payload))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
    const unsignedToken = `${headerB64}.${payloadB64}`
    
    console.log('🔍 Header B64:', headerB64)
    console.log('🔍 Payload B64:', payloadB64)
    console.log('🔍 Unsigned token length:', unsignedToken.length)
    
    // Use Auth Token as the signing key
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(authToken), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(unsignedToken))
    const signatureB64 = base64Encode(new Uint8Array(signature)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
    const token = `${unsignedToken}.${signatureB64}`

    console.log('🔍 Signature B64:', signatureB64)
    console.log('🔍 Final token length:', token.length)
    console.log('🔍 Token preview:', token.substring(0, 50) + '...')
    console.log('✅ Twilio token generated successfully for user:', user.email)
    console.log('🎯 Token preview:', token.substring(0, 50) + '...')
    
    return new Response(JSON.stringify({ token }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('❌ Twilio token generation failed:', error)
    console.error('❌ Error stack:', error.stack)
    
    const errorMessage = error.message || 'Unknown error occurred'
    console.error('❌ Returning error response:', errorMessage)
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})