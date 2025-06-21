#!/bin/bash

echo "🚀 Starting Shield CRM with Supabase Cloud deployment..."

# Copy cloud environment configuration
echo "📋 Configuring environment for cloud deployment..."
cp .env.cloud .env

# Update Twilio to use cloud webhook
echo "📞 Updating Twilio configuration..."
./update-twilio-cloud.sh

# Start the CRM application
echo "🎯 Starting CRM application..."
npm run dev

echo ""
echo "✅ CRM is now running with cloud deployment!"
echo "🌐 Access your CRM at: http://localhost:8083"
echo "☁️  Using Supabase Cloud backend"
echo "📞 Twilio calls working without ngrok!" 