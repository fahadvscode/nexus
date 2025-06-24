# Twilio Voice Integration Setup Guide

This guide will help you set up Twilio Voice integration for making calls directly from the CRM.

## Prerequisites

1. **Twilio Account**: Sign up at [twilio.com](https://www.twilio.com)
2. **Twilio Phone Number**: Purchase a phone number for outbound calls
3. **TwiML App**: Create a TwiML application for voice calls

## Step 1: Twilio Account Setup

### 1.1 Create Twilio Account
- Sign up at [twilio.com](https://www.twilio.com)
- Verify your phone number
- Get your Account SID from the Console Dashboard

### 1.2 Purchase a Phone Number
- Go to Phone Numbers → Manage → Buy a number
- Choose a number with Voice capabilities
- Note down the phone number (format: +1234567890)

### 1.3 Create API Key
- Go to Settings → API Keys & Tokens
- Click "Create API Key"
- Choose "Standard" key type
- Save the SID and Secret (you won't see the secret again!)

### 1.4 Create TwiML Application
- Go to Voice → TwiML → TwiML Apps
- Click "Create new TwiML App"
- Set the Voice URL to: `http://127.0.0.1:54321/functions/v1/handle-voice`
- Save and note the App SID

## Step 2: Configure Environment Variables

Edit `supabase/config.toml` and replace the placeholder values:

```toml
[env]
TWILIO_ACCOUNT_SID = "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_API_KEY_SID = "SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" 
TWILIO_API_KEY_SECRET = "your_api_key_secret_here"
TWILIO_TWIML_APP_SID = "APxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_PHONE_NUMBER = "+1234567890"
```

## Step 3: Start Services

```bash
# Start Supabase (if not already running)
npx supabase start

# Start the React app
npm run dev
```

## Step 4: Test the Integration

1. **Login to CRM**: Use `info@fahadsold.com` / `Wintertime2021!`
2. **Check Status**: Look for "Twilio Ready" badge in Quick Dialer
3. **Test Call**: Use the "Twilio Calling Test" button
4. **Make Real Calls**: Click "Call" on any client

## Troubleshooting

### Common Issues

1. **"Token fetch error"**
   - Check that Supabase is running
   - Verify you're logged in to the CRM
   - Check browser console for detailed errors

2. **"Device not ready"**
   - Verify Twilio credentials in config.toml
   - Check that TwiML App URL is correct
   - Ensure API Key has Voice permissions

3. **"Call failed"**
   - Check phone number format (+1234567890)
   - Verify TwiML App configuration
   - Check Twilio Console for error logs

### Browser Requirements

- **Chrome/Edge**: Recommended browsers
- **HTTPS**: Required for microphone access (use localhost for development)
- **Microphone**: Allow microphone permissions when prompted

## Demo Mode

For testing without Twilio credentials, the system will fall back to a demo mode that simulates calls.

## Production Deployment

For production deployment:

1. Set environment variables in your hosting platform
2. Update TwiML App URL to your production domain
3. Configure HTTPS for secure WebRTC connections
4. Set up proper error logging and monitoring

## Cost Considerations

- **Outbound Calls**: ~$0.013 per minute (US)
- **Phone Number**: ~$1 per month
- **TwiML App**: Free

Check [Twilio Pricing](https://www.twilio.com/voice/pricing) for current rates.

## Support

- **Twilio Docs**: [twilio.com/docs/voice](https://www.twilio.com/docs/voice)
- **CRM Issues**: Check browser console and Supabase logs
- **WebRTC Issues**: Ensure HTTPS and microphone permissions 