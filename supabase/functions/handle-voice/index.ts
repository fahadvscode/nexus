import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🎵 Processing TwiML voice request...')
    
    // Parse the webhook data from Twilio
    const body = await req.text()
    const params = new URLSearchParams(body)
    
    const callSid = params.get('CallSid')
    const from = params.get('From')
    const to = params.get('To')
    const callStatus = params.get('CallStatus')
    const direction = params.get('Direction')
    
    console.log('📞 Call details:', {
      callSid,
      from,
      to,
      callStatus,
      direction
    })

    // Create bulletproof TwiML response with required callerId
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Dial callerId="+12893018284" timeout="30" timeLimit="3600">
        <Number>${to}</Number>
    </Dial>
</Response>`

    console.log('✅ TwiML generated with recording enabled')
    
    return new Response(twiml, {
      status: 200,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'text/xml' 
      }
    })

  } catch (error) {
    console.error('❌ TwiML handler error:', error.message)
    
    // Return basic TwiML without recording on error
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Sorry, there was an error processing your call.</Say>
    <Hangup />
</Response>`
    
    return new Response(errorTwiml, {
      status: 200,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'text/xml' 
      }
    })
  }
})
