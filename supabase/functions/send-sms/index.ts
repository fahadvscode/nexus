// supabase/functions/send-sms/index.ts
// SMS Sending Function - API Key Authentication - June 26, 2025
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('📱 Processing SMS send request...')
    
    // Check for authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Authorization header required')
    }
    
    // Create Supabase client for user validation
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
    
    // Validate user JWT token
    const jwt = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(jwt)
    
    if (userError || !user) {
      throw new Error('Invalid authentication token')
    }
    
    console.log('✅ User validated:', user.email)
    
    // Parse request body
    const { to, message, clientName, isBulk = false, clientIds = [] } = await req.json()
    
    if (!to || !message) {
      throw new Error('Missing required fields: to and message')
    }
    
    // Get Twilio credentials
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN')
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER') || '***REMOVED***'
    
    if (!accountSid || !authToken) {
      throw new Error('Missing Twilio credentials')
    }
    
    console.log('📱 Sending SMS:', { to, from: twilioPhoneNumber, isBulk })
    
    // Prepare recipients list
    const recipients = Array.isArray(to) ? to : [to]
    const results = []
    
    // Send SMS to each recipient
    for (const recipient of recipients) {
      try {
        // Clean phone number
        let cleanNumber = recipient.replace(/[^\d+]/g, '')
        if (!cleanNumber.startsWith('+')) {
          cleanNumber = '+1' + cleanNumber
        }
        
        // Create Twilio API URL
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
        
        // Prepare form data
        const formData = new URLSearchParams()
        formData.append('From', twilioPhoneNumber)
        formData.append('To', cleanNumber)
        formData.append('Body', message)
        
        // Create basic auth header (Account SID : Auth Token)
        const credentials = btoa(`${accountSid}:${authToken}`)
        
        // Send SMS via Twilio API
        const response = await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData
        })
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error(`❌ SMS failed for ${cleanNumber}:`, errorText)
          results.push({
            to: cleanNumber,
            success: false,
            error: errorText,
            clientName: clientName || 'Unknown'
          })
          continue
        }
        
        const result = await response.json()
        console.log(`✅ SMS sent successfully to ${cleanNumber}:`, result.sid)
        
        results.push({
          to: cleanNumber,
          success: true,
          sid: result.sid,
          status: result.status,
          clientName: clientName || 'Unknown'
        })
        
        // Log SMS to database if needed
        try {
          await supabaseClient.from('sms_logs').insert({
            user_id: user.id,
            to_number: cleanNumber,
            message: message,
            twilio_sid: result.sid,
            status: result.status,
            client_name: clientName,
            is_bulk: isBulk,
            sent_at: new Date().toISOString()
          })
        } catch (dbError) {
          console.log('⚠️ Failed to log SMS to database:', dbError.message)
          // Continue anyway - SMS was sent successfully
        }
        
      } catch (smsError) {
        console.error(`❌ SMS error for ${recipient}:`, smsError.message)
        results.push({
          to: recipient,
          success: false,
          error: smsError.message,
          clientName: clientName || 'Unknown'
        })
      }
    }
    
    // Summary statistics
    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length
    
    console.log(`📊 SMS Summary: ${successful} sent, ${failed} failed`)
    
    return new Response(JSON.stringify({
      success: true,
      summary: {
        total: results.length,
        successful,
        failed
      },
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('❌ SMS sending failed:', error.message)
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}) 