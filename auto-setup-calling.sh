#!/bin/bash

echo "🚀 Auto-Setup: Real Calling Mode"
echo "================================"

# --- Safety Check ---
if [ ! -f .env.cloud ]; then
    echo "🔴 Error: .env.cloud file not found."
    echo "Please copy .env.cloud.example to .env.cloud and fill in your credentials."
    exit 1
fi

# --- Load Environment Variables ---
source .env.cloud

# --- Validate Credentials ---
if [[ -z "$TWILIO_ACCOUNT_SID" || -z "$TWILIO_AUTH_TOKEN" || -z "$VITE_TWILIO_APP_SID" ]]; then
    echo "🔴 Error: One or more required Twilio variables are missing in .env.cloud."
    echo "Please ensure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and VITE_TWILIO_APP_SID are set."
    exit 1
fi

echo "✅ Credentials loaded from .env.cloud."
echo "Setting secrets for Supabase project..."

# --- Set Supabase Secrets ---
# Replace 'your-project-ref' with your actual Supabase project reference if it's not detected automatically
PROJECT_REF=$(cat supabase/.temp/project-ref)

supabase secrets set --project-ref $PROJECT_REF \
  TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
  TWILIO_AUTH_TOKEN="your_twilio_auth_token" \
  TWILIO_APP_SID="APxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

echo "✅ Supabase secrets have been set."
echo "🚀 Your cloud calling environment is ready!"

echo "🔧 Starting ngrok tunnel..."
ngrok http 54321 > /dev/null 2>&1 &
NGROK_PID=$!

# Wait for ngrok to start
sleep 5

echo "🌐 Getting ngrok URL..."
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$NGROK_URL" ]; then
    echo "❌ Failed to get ngrok URL"
    kill $NGROK_PID 2>/dev/null
    exit 1
fi

echo "✅ Ngrok URL: $NGROK_URL"

# Update TwiML App automatically
VOICE_URL="${NGROK_URL}/functions/v1/handle-voice"

echo "🔄 Updating Twilio TwiML App..."
curl -X POST "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Applications/$TWIML_APP_SID.json" \
    --data-urlencode "VoiceUrl=$VOICE_URL" \
    --data-urlencode "VoiceMethod=POST" \
    -u "$TWILIO_API_KEY_SID:$TWILIO_API_KEY_SECRET" \
    > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ TwiML App updated successfully!"
    echo "📞 Voice URL set to: $VOICE_URL"
    echo ""
    echo "🎯 Real calling is now active!"
    echo "💡 Keep this terminal open to maintain the tunnel"
    echo "🛑 Press Ctrl+C to stop ngrok and revert to demo mode"
    echo ""
    
    # Keep ngrok running and wait for user to stop
    wait $NGROK_PID
else
    echo "❌ Failed to update TwiML App"
    echo "💡 You may need to update manually at: https://console.twilio.com"
    kill $NGROK_PID 2>/dev/null
    exit 1
fi 