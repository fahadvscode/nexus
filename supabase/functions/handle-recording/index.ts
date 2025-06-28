// supabase/functions/handle-recording/index.ts
// Call Recording Handler - Manages Twilio recording webhooks and storage
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🎵 Processing recording webhook...')
    
    // Parse the webhook data from Twilio
    const body = await req.text()
    const params = new URLSearchParams(body)
    
    const recordingSid = params.get('RecordingSid')
    const callSid = params.get('CallSid')
    const recordingUrl = params.get('RecordingUrl')
    const recordingDuration = params.get('RecordingDuration')
    const recordingStatus = params.get('RecordingStatus')
    const recordingChannels = params.get('RecordingChannels')
    const recordingSource = params.get('RecordingSource')
    
    console.log('📞 Recording details:', {
      recordingSid,
      callSid,
      recordingUrl,
      recordingDuration,
      recordingStatus
    })

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Find the call log entry to get client information
    const { data: callLog, error: callError } = await supabaseClient
      .from('call_logs')
      .select('*')
      .eq('twilio_call_sid', callSid)
      .single()

    if (callError) {
      console.error('❌ Error finding call log:', callError)
      throw new Error('Call log not found')
    }

    // Store the recording information
    const { error: recordingError } = await supabaseClient
      .from('call_recordings')
      .insert({
        recording_sid: recordingSid,
        call_sid: callSid,
        call_log_id: callLog.id,
        client_id: callLog.client_id,
        recording_url: recordingUrl,
        duration_seconds: parseInt(recordingDuration || '0'),
        status: recordingStatus,
        channels: parseInt(recordingChannels || '1'),
        source: recordingSource,
        created_at: new Date().toISOString()
      })

    if (recordingError) {
      console.error('❌ Error storing recording:', recordingError)
      throw new Error('Failed to store recording')
    }

    // Update the call log to indicate recording is available
    const { error: updateError } = await supabaseClient
      .from('call_logs')
      .update({ has_recording: true })
      .eq('id', callLog.id)

    if (updateError) {
      console.error('❌ Error updating call log:', updateError)
    }

    console.log('✅ Recording stored successfully')
    
    return new Response('OK', {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
    })

  } catch (error) {
    console.error('❌ Recording webhook error:', error.message)
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}) 