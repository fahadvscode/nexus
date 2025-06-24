
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Handle Voice request received');
    
    // Get the Twilio phone number from environment variables
    let twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");
    
    // Fallback to your purchased phone number for local development
    if (!twilioPhoneNumber) {
      twilioPhoneNumber = "+12893018284"; // Your purchased number: (289) 301-8284
      console.log('🔄 Using fallback phone number:', twilioPhoneNumber);
    }

    if (!twilioPhoneNumber) {
      console.error('❌ Missing Twilio phone number');
      const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say>We're sorry, the calling service is not configured correctly.</Say>
    <Hangup/>
</Response>`;
      return new Response(errorTwiml, { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'text/xml' }
      });
    }

    // Parse the form data from Twilio
    const formData = await req.formData();
    const to = formData.get('To');
    const from = formData.get('From');
    const callSid = formData.get('CallSid');
    
    console.log('Voice call details:', {
      to: to?.toString(),
      from: from?.toString(),
      callSid: callSid?.toString()
    });

    // Generate TwiML response to dial the number
    const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Dial callerId="${twilioPhoneNumber}" timeout="30" record="false">
        <Number>${to}</Number>
    </Dial>
</Response>`;

    console.log('Generated TwiML:', twimlResponse);

    return new Response(twimlResponse, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/xml'
      }
    });
  } catch (error: any) {
    console.error('❌ Handle Voice error:', error);
    
    // Return a TwiML error response
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say>Sorry, there was an error processing your call.</Say>
    <Hangup/>
</Response>`;

    return new Response(errorTwiml, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/xml'
      }
    });
  }
});
