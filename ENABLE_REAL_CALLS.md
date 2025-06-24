# Enable Real Twilio Calls

When you're ready to enable real Twilio calls instead of demo mode, follow these steps:

## Step 1: Expose Your Webhook with ngrok

1. Install ngrok: `brew install ngrok` (if not already installed)
2. Start ngrok: `ngrok http 54321`
3. Copy the ngrok URL (e.g., `https://abc123.ngrok.io`)

## Step 2: Update Your TwiML Application

1. Go to [Twilio Console](https://console.twilio.com/)
2. Navigate to: Voice → TwiML → TwiML Apps  
3. Find your TwiML app (SID: `AP5617c22a010bf4a45403196ffbf30bae`)
4. Update Voice URL to: `https://YOUR-NGROK-URL.ngrok.io/functions/v1/handle-voice`
5. Save the configuration

## Step 3: Revert Demo Mode Changes

Replace the demo mode code in `src/hooks/useTwilioStore.ts`:

**Find this line (around line 244):**
```javascript
// For local development, always use demo mode to avoid webhook connectivity issues
console.log('🎭 Using demo mode for local development');
await simulateDemoCall(cleanNumber, clientName, phoneNumber);
```

**Replace with:**
```javascript
// Check if we have a real Twilio device or are in demo mode
if (device && !error?.includes('Demo Mode')) {
  // Real Twilio call
  try {
    const call = await device.connect({
      params: {
        To: cleanNumber,
        ClientName: clientName || 'Unknown Client',
        ClientId: clientId || 'unknown'
      }
    });

    setActiveCall(call);
    setupCallEventHandlers(call);

    toast({
      title: "Call Initiated",
      description: `Calling ${clientName || phoneNumber} via Twilio...`,
    });

    console.log('✅ Twilio call initiated successfully:', call.parameters.CallSid);
  } catch (twilioError: any) {
    console.log('⚠️ Twilio call failed, falling back to demo mode:', twilioError.message);
    // Fall back to demo mode if real call fails
    await simulateDemoCall(cleanNumber, clientName, phoneNumber);
  }
} else {
  // Demo mode - simulate a call
  await simulateDemoCall(cleanNumber, clientName, phoneNumber);
}
```

## Step 4: Test Real Calls

1. Restart your development server: `npm run dev`
2. Make sure ngrok is running and the TwiML app is updated
3. Try making calls - they should now be real Twilio calls!

## Important Notes

- **Keep ngrok running** while testing real calls
- **Audio will play through your computer speakers/headset**
- **You can call real phone numbers** (charges may apply)
- **Webhook must be accessible** from Twilio's servers

## Troubleshooting

- **Error 31005:** TwiML app can't reach webhook (check ngrok URL)
- **Error 20404:** Invalid phone number format
- **Error 21217:** Phone number is not verified (trial accounts)
- **Audio issues:** Check browser permissions for microphone access 