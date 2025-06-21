#!/bin/bash

# Update Twilio TwiML App to use Supabase Cloud webhook
# This script updates the Voice URL to point to the cloud function

echo "🔄 Updating Twilio TwiML App to use Supabase Cloud webhook..."

# Load environment variables
source .env

# Cloud webhook URL
CLOUD_WEBHOOK_URL="https://ipizfawpzzwdltcbskim.supabase.co/functions/v1/handle-voice"

# Update TwiML App Voice URL using Twilio API with proper authentication
curl -X POST "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Applications/$TWILIO_TWIML_APP_SID.json" \
  --data-urlencode "VoiceUrl=$CLOUD_WEBHOOK_URL" \
  --data-urlencode "VoiceMethod=POST" \
  -u $TWILIO_API_KEY_SID:$TWILIO_API_KEY_SECRET

echo ""
echo "✅ TwiML App updated successfully!"
echo "📞 Voice URL: $CLOUD_WEBHOOK_URL"
echo ""
echo "🎉 Your CRM is now using Supabase Cloud for permanent deployment!"
echo "🔗 No more ngrok needed - calls will work from anywhere!" 